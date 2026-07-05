/**
 * src/scoring/adapters/llm-judge.ts — concrete LLMJudge backed by
 * the existing runtime LLM helper (src/llm/runtime.ts).
 *
 * Builds the rubric-grading prompt, calls the model, and parses a
 * STRICT JSON response shape. NEVER coerces unparseable output — a
 * malformed response throws so the caller routes to the teacher queue
 * rather than ship a guessed grade.
 *
 * What we do not do here:
 *   - decide whether the FINAL ANSWER is right (CASChecker does that)
 *   - sum the marks (RubricGrader does that)
 *   - persist anything (caller persists)
 *
 * Per blueprint §3.5: reason-then-score with internal chain-of-thought;
 * the surfaced response carries only per-criterion scores + actionable
 * feedback. We instruct the model to put its reasoning in a `_reasoning`
 * field which we drop on parse.
 */

import { getLlmForRole } from '../../llm/runtime';
import type { LLMRole } from '../../llm/provider-registry';
import type { LLMJudge } from '../rubric-grader';
import type { ItemContext } from '../../core/interfaces';

// ────────────────────────────────────────────────────────────────────
// Tuneables
// ────────────────────────────────────────────────────────────────────

/** Truncate the official solution we ground on. Keeps prompt tokens bounded. */
export const MAX_SOLUTION_CHARS = 8_000;
/** Truncate the student response we send to the model. */
export const MAX_RESPONSE_CHARS = 20_000;

const JUDGE_SYSTEM = [
  'You are a rigorous mathematics examiner grading a student response.',
  'You award METHOD MARKS and PARTIAL CREDIT per criterion exactly as a human examiner would.',
  'You do NOT judge whether the final numerical answer is correct — a separate',
  'computer-algebra check handles that. Focus on the method and the steps.',
  '',
  'Respond with STRICT JSON only:',
  '{',
  '  "_reasoning": "your internal step-by-step reasoning, dropped before display",',
  '  "perCriterion": { "<criterion_id>": <integer marks 0..max>, ... },',
  '  "feedback": "2-3 sentences of actionable feedback for the student",',
  '  "confidence": <number 0.0..1.0 — how confident YOU are in this grade>',
  '}',
  '',
  'Rules:',
  '- Every rubric criterion id MUST appear in perCriterion exactly once.',
  '- Marks per criterion MUST be integers within 0..maxMarks for that criterion.',
  '- Set confidence below 0.7 if the response is ambiguous, off-topic, or you had',
  '  to guess at the student\'s intent.',
].join('\n');

// ────────────────────────────────────────────────────────────────────
// Implementation
// ────────────────────────────────────────────────────────────────────

export interface RuntimeJudgeOpts {
  /** Optional override role passed through to getLlmForRole. */
  role?: LLMRole;
  /** Optional per-request headers (for the X-Vidhya-Llm-Config cascade). */
  headers?: Record<string, string>;
}

export class RuntimeLLMJudge implements LLMJudge {
  constructor(private opts: RuntimeJudgeOpts = {}) {}

  async gradeRubric(args: {
    studentResponse: string;
    item: ItemContext;
    correlationId?: string;
  }): Promise<{
    perCriterion: Record<string, number>;
    feedback: string;
    confidence: number;
  }> {
    if (!args.item.rubric || args.item.rubric.length === 0) {
      throw new Error('RuntimeLLMJudge.gradeRubric called without a rubric.');
    }

    const llm = await getLlmForRole(this.opts.role ?? 'chat', this.opts.headers);
    if (!llm) {
      throw new Error('RuntimeLLMJudge: no LLM configured (set GEMINI_API_KEY or pass X-Vidhya-Llm-Config).');
    }

    const prompt = buildPrompt(args.studentResponse, args.item);
    const raw = await llm.generate({ text: prompt, system: JUDGE_SYSTEM });
    return parseJudgeResponse(raw ?? '', args.item);
  }
}

export function makeRuntimeJudge(opts: RuntimeJudgeOpts = {}): LLMJudge {
  return new RuntimeLLMJudge(opts);
}

// ────────────────────────────────────────────────────────────────────
// Prompt builder + parser (exported for tests)
// ────────────────────────────────────────────────────────────────────

export function buildPrompt(studentResponse: string, item: ItemContext): string {
  const trimmedResponse = studentResponse.length > MAX_RESPONSE_CHARS
    ? studentResponse.slice(0, MAX_RESPONSE_CHARS) + '\n…[truncated]'
    : studentResponse;
  const trimmedSolution = (item.officialSolution ?? '').slice(0, MAX_SOLUTION_CHARS);

  const lines: string[] = [
    `Item max marks: ${item.maxMarks}`,
    '',
    'Rubric criteria:',
  ];
  for (const c of item.rubric!) {
    lines.push(`  - id="${c.id}" maxMarks=${c.maxMarks} — ${c.description}`);
  }
  lines.push('');
  if (trimmedSolution) {
    lines.push('OFFICIAL SOLUTION (grounding — do not echo to the student):');
    lines.push(trimmedSolution);
    lines.push('');
  }
  lines.push('STUDENT RESPONSE:');
  lines.push(trimmedResponse);
  lines.push('');
  lines.push('Grade the response per rubric. Respond with STRICT JSON only.');
  return lines.join('\n');
}

/**
 * Parse + validate the judge response. Rejects anything that doesn't
 * match the contract — never coerces, never guesses. The caller turns
 * the thrown error into a teacher-queue route.
 */
export function parseJudgeResponse(
  raw: string,
  item: ItemContext
): { perCriterion: Record<string, number>; feedback: string; confidence: number } {
  if (!raw || typeof raw !== 'string') {
    throw new Error('LLMJudge: empty response');
  }
  // Models often wrap JSON in ```json fences — strip them.
  const stripped = raw.trim().replace(/^```(?:json)?\s*|```$/g, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(stripped);
  } catch (e) {
    throw new Error(`LLMJudge: response is not valid JSON: ${(e as Error).message}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('LLMJudge: response is not an object');
  }
  if (!parsed.perCriterion || typeof parsed.perCriterion !== 'object') {
    throw new Error('LLMJudge: missing perCriterion object');
  }
  if (typeof parsed.feedback !== 'string') {
    throw new Error('LLMJudge: missing feedback string');
  }
  if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
    throw new Error('LLMJudge: confidence missing or out of [0,1] range');
  }

  // Validate every rubric criterion has a numeric score; reject extras.
  const rubricIds = new Set(item.rubric!.map(c => c.id));
  const seen = new Set<string>();
  for (const [id, val] of Object.entries(parsed.perCriterion)) {
    if (!rubricIds.has(id)) {
      throw new Error(`LLMJudge: unknown criterion "${id}" not in rubric`);
    }
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new Error(`LLMJudge: non-numeric score for criterion "${id}"`);
    }
    seen.add(id);
  }
  for (const id of rubricIds) {
    if (!seen.has(id)) throw new Error(`LLMJudge: missing score for criterion "${id}"`);
  }

  return {
    perCriterion: parsed.perCriterion,
    feedback: parsed.feedback,
    confidence: parsed.confidence,
  };
}
