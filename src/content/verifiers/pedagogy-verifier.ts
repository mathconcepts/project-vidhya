/**
 * src/content/verifiers/pedagogy-verifier.ts
 *
 * Tier 4 ContentVerifier — judges whether a curriculum_unit (or atom)
 * meets a pedagogical quality bar before serving. Implements the
 * `ContentVerifier` contract from `./types.ts`.
 *
 * Why this exists: PR #28's spine measures *answer correctness* (Tiers 1-3)
 * but not *pedagogical soundness*. An interactive widget config that's
 * valid TypeScript can still teach the wrong thing. PR #32 lands this
 * verifier before PR #33's interactive atom kinds need it.
 *
 * Five-criterion rubric (each scored 0..1, total normalized):
 *   1. concept_fidelity        — does the content correctly represent the concept?
 *   2. pedagogical_sequence    — intuition → formal → example → practice; ordered well?
 *   3. learning_objective_coverage — does it teach what it claims to?
 *   4. interactive_correctness — if interactives present, do they behave?
 *   5. distractor_quality      — are MCQ distractors plausible misconceptions, not noise?
 *
 * Operating modes:
 *   - Shadow mode (default for first 2 weeks per eng-review risk note):
 *     records score but never gates publication. Set
 *     VIDHYA_PEDAGOGY_GATE=on to enable the gate.
 *   - Gating mode (post-calibration): score >= threshold → passed=true.
 *     Threshold defaults to 0.65; tuneable via VIDHYA_PEDAGOGY_THRESHOLD.
 *
 * Implementation: LLM-judge via the existing `getLlmForRole` runtime;
 * temperature 0; structured JSON output. Model defaults to gemini-2.5-pro
 * for stronger reasoning; falls back to gemini-2.5-flash if unavailable.
 *
 * Fails closed on errors (timeout, malformed LLM response, missing API
 * key) with a low score — the safer default for a quality gate.
 */

import type {
  ContentVerifier,
  ContentVerifierResult,
} from './types';

const TIMEOUT_MS = 25_000;
const DEFAULT_THRESHOLD = 0.65;

interface RubricScores {
  concept_fidelity: number;
  pedagogical_sequence: number;
  learning_objective_coverage: number;
  interactive_correctness: number;
  distractor_quality: number;
}

interface RubricResult {
  scores: RubricScores;
  weighted_total: number;
  notes: string[];
}

const RUBRIC_WEIGHTS: Record<keyof RubricScores, number> = {
  concept_fidelity: 0.30,
  pedagogical_sequence: 0.20,
  learning_objective_coverage: 0.20,
  interactive_correctness: 0.15,
  distractor_quality: 0.15,
};

const RUBRIC_PROMPT = `You are a pedagogy reviewer for an exam-prep platform (Vidhya).
Score the content on each criterion from 0.0 (terrible) to 1.0 (excellent).
Return ONLY a JSON object — no prose before or after.

Criteria:
1. concept_fidelity — Does the content correctly represent the concept? (math/science accuracy, no misconceptions baked in)
2. pedagogical_sequence — Are atoms ordered intuition → formal → worked example → practice? Are prerequisites surfaced before the dependent concept?
3. learning_objective_coverage — Does the content teach what its declared learning objectives say it teaches? Score 0 if objectives present but unaddressed.
4. interactive_correctness — If interactive atoms are present (manipulables, simulations, walkthroughs), do they behave correctly? Return 1.0 if no interactives are present.
5. distractor_quality — For MCQ distractors: are they plausible misconceptions a real student would have? Score low if distractors are obviously wrong / random / off-topic. Return 1.0 if no MCQ practice atoms are present.

Output JSON shape:
{
  "scores": {
    "concept_fidelity": 0.0-1.0,
    "pedagogical_sequence": 0.0-1.0,
    "learning_objective_coverage": 0.0-1.0,
    "interactive_correctness": 0.0-1.0,
    "distractor_quality": 0.0-1.0
  },
  "notes": ["one-line observation per low-scoring criterion"]
}
`;

/**
 * Combine the 5 rubric scores into a single weighted total in [0, 1].
 * Pure function; exported for tests.
 */
export function weightedTotal(scores: RubricScores): number {
  let total = 0;
  for (const k of Object.keys(RUBRIC_WEIGHTS) as Array<keyof RubricScores>) {
    const v = clamp01(scores[k]);
    total += v * RUBRIC_WEIGHTS[k];
  }
  return Math.max(0, Math.min(1, total));
}

function clamp01(x: unknown): number {
  const n = typeof x === 'number' ? x : Number(x);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/**
 * Parse the LLM's JSON response. Returns null on malformed input — caller
 * fails closed with a low score.
 */
export function parseRubricResponse(raw: string): RubricResult | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  // Some LLMs wrap JSON in markdown fences; strip a leading ```json ... ```
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  let parsed: any;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || !parsed.scores) return null;
  const s = parsed.scores;
  const scores: RubricScores = {
    concept_fidelity: clamp01(s.concept_fidelity),
    pedagogical_sequence: clamp01(s.pedagogical_sequence),
    learning_objective_coverage: clamp01(s.learning_objective_coverage),
    interactive_correctness: clamp01(s.interactive_correctness),
    distractor_quality: clamp01(s.distractor_quality),
  };
  const notes: string[] = Array.isArray(parsed.notes)
    ? parsed.notes.filter((n: unknown) => typeof n === 'string').slice(0, 8)
    : [];
  return { scores, weighted_total: weightedTotal(scores), notes };
}

// ============================================================================
// LLM call (lazy import — avoids loading the runtime in DB-less tests)
// ============================================================================

async function callLlmJudge(prompt: string): Promise<string> {
  const { getLlmForRole } = await import('../../llm/runtime');
  // Try the structured-output role first, fall back to chat. The runtime's
  // resolver returns null if no provider is configured; we surface a clear
  // error so the verifier fails closed at the call site.
  const llm = (await getLlmForRole('json')) ?? (await getLlmForRole('chat'));
  if (!llm) {
    throw new Error('no LLM configured for json/chat role');
  }

  const result = await Promise.race<string | null>([
    llm.generate(
      {
        text: prompt,
        system: 'You are a strict but fair pedagogy reviewer. Output only valid JSON — no prose.',
      },
      {
        temperature: 0,
        maxTokens: 800,
      },
    ),
    new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('pedagogy verifier timeout')), TIMEOUT_MS),
    ),
  ]);

  if (result == null) {
    throw new Error('LLM returned null (network or provider error)');
  }
  return result;
}

// ============================================================================
// Public verifier instance
// ============================================================================

export const pedagogyVerifier: ContentVerifier = {
  name: 'pedagogy-llm-judge',
  tier: 4, // Reserved for Tier 4+ extensions per src/verification/tiered-orchestrator.ts

  async verify(content: string, context?: { concept_id?: string }): Promise<ContentVerifierResult> {
    const inGatingMode = process.env.VIDHYA_PEDAGOGY_GATE === 'on';
    const threshold = parseFloat(process.env.VIDHYA_PEDAGOGY_THRESHOLD ?? '') || DEFAULT_THRESHOLD;

    const conceptHint = context?.concept_id ? `\nConcept under review: ${context.concept_id}` : '';
    const prompt =
      `${RUBRIC_PROMPT}\n` +
      `${conceptHint}\n\n` +
      `Content to score:\n---\n${content.slice(0, 8000)}\n---\n\n` +
      `Return ONLY the JSON object, no prose.`;

    let raw: string;
    try {
      raw = await callLlmJudge(prompt);
    } catch (e: any) {
      // Fail closed: low score, surface reason in telemetry.
      return {
        passed: !inGatingMode, // shadow mode lets it through; gating mode blocks
        score: 0,
        reason: `pedagogy-verifier-error: ${e?.message ?? String(e)}`,
      };
    }

    const parsed = parseRubricResponse(raw);
    if (!parsed) {
      return {
        passed: !inGatingMode,
        score: 0,
        reason: 'pedagogy-verifier-malformed-llm-output',
      };
    }

    const passed = inGatingMode ? parsed.weighted_total >= threshold : true;
    return {
      passed,
      score: parsed.weighted_total,
      reason: passed
        ? undefined
        : `score ${parsed.weighted_total.toFixed(3)} below threshold ${threshold.toFixed(2)}: ${parsed.notes.join(' | ')}`,
    };
  },

  async healthCheck(): Promise<boolean> {
    // Don't actually call the LLM in healthCheck — too expensive.
    // Return true if we have a DATABASE_URL (no specific dep) and an
    // LLM module path resolvable. Cheap proxy: import succeeds.
    try {
      await import('../../llm/runtime');
      return true;
    } catch {
      return false;
    }
  },
};

export default pedagogyVerifier;

// Exported for tests
export const __testing = { weightedTotal, parseRubricResponse, RUBRIC_WEIGHTS };
