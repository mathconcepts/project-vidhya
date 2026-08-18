/**
 * src/generation/practice-item-factory/parse.ts — strict parser: raw LLM
 * text → validated PracticeItemGenerationResponse, or a refusal.
 *
 * Every field is required and shape-checked. A missing or malformed field
 * refuses the WHOLE response rather than guessing a default — the same
 * discipline deriveMarking() already applies one layer downstream. This
 * also closes a real production bug: the batch pipeline pins
 * max_output_tokens at 2048, small enough that a truncated item+solution
 * payload used to LOWER the floor count silently (see
 * scripts/check-syllabus-floor.ts's loadPracticeCounts — a malformed bank
 * now fails loudly there too, for the same reason).
 */

import type { PracticeItemFormat, PracticeItemGenerationResponse } from './types';

export interface ParseResult {
  ok: boolean;
  response?: PracticeItemGenerationResponse;
  /** Present iff ok === false. */
  reason?: string;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function isNonEmptyStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.length > 0 && v.every((x) => isNonEmptyString(x));
}

/**
 * Parse + validate one generation response for the given target format.
 * `format` decides whether `correct_answer` (mcq/nat) or `correct_answers`
 * (msq) is the required key — the other is simply not checked (assemble.ts
 * only reads the one the format needs).
 */
export function parsePracticeItemResponse(raw: string, format: PracticeItemFormat): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { ok: false, reason: `invalid JSON: ${(err as Error).message}` };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reason: 'response is not a JSON object' };
  }
  const obj = parsed as Record<string, unknown>;

  if (!isNonEmptyString(obj.question_text)) {
    return { ok: false, reason: 'question_text missing or empty' };
  }
  if (!isStringArray(obj.distractors)) {
    return { ok: false, reason: 'distractors missing or not a string[]' };
  }
  if (!isNonEmptyStringArray(obj.solution_steps)) {
    return { ok: false, reason: 'solution_steps missing, empty, or not a non-empty-string[]' };
  }
  if (typeof obj.difficulty !== 'number' || !Number.isFinite(obj.difficulty) || obj.difficulty < 0 || obj.difficulty > 1) {
    return { ok: false, reason: 'difficulty missing, not a number, or out of [0,1] range' };
  }

  if (format === 'msq') {
    if (!isNonEmptyStringArray(obj.correct_answers) || (obj.correct_answers as string[]).length < 2) {
      return { ok: false, reason: 'correct_answers missing or fewer than 2 entries (required for msq)' };
    }
  } else {
    if (!isNonEmptyString(obj.correct_answer)) {
      return { ok: false, reason: 'correct_answer missing or empty (required for mcq/nat)' };
    }
  }

  const response: PracticeItemGenerationResponse = {
    question_text: obj.question_text as string,
    distractors: obj.distractors as string[],
    solution_steps: obj.solution_steps as string[],
    difficulty: obj.difficulty as number,
    ...(format === 'msq'
      ? { correct_answers: obj.correct_answers as string[] }
      : { correct_answer: obj.correct_answer as string }),
  };
  return { ok: true, response };
}
