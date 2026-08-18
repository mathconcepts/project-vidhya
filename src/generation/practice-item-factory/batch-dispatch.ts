/**
 * src/generation/practice-item-factory/batch-dispatch.ts — the per-job
 * pipeline the batch poller (src/generation/batch/poller.ts) routes
 * practice-item jobs through: parse → assemble → verify → (written |
 * refused | parse_failed | pending_retry). Pure orchestration over
 * injected dependencies — no network calls of its own; the caller wires
 * `deps.solveSecondary` / `deps.wolframCheck` to real providers in
 * production, and tests inject fixtures.
 *
 * Verification path per format (ENG-D4 item 8 / outside-voice amendment
 * 4): mcq/msq go through dual-model consensus (answer-check.ts); nat goes
 * through Wolfram (tri-stated per the T7 precondition fix in
 * src/services/wolfram-service.ts — 'inconclusive' is retry-later, never
 * a rejection).
 */

import type { AtomSpec } from '../batch/types';
import type { AuthoredItem } from '../../scoring/learning-object-catalog-file';
import { parsePracticeItemResponse } from './parse';
import { assemblePracticeItem, verificationPathForFormat } from './assemble';
import { runDualLegAnswerCheck, type SolveFn } from './answer-check';
import type { PracticeItemFormat, PracticeItemSpec } from './types';

/** Matches the tri-state shape verifyProblemWithWolfram returns (D-2 fix). */
export interface WolframCheckFn {
  (problemText: string, expectedAnswer: string): Promise<{
    status: 'verified' | 'failed' | 'inconclusive';
    wolfram_answer: string | null;
  }>;
}

export interface PracticeItemDispatchDeps {
  /** mcq/msq second leg. null/omitted = no live wiring yet → those items refuse (fail-closed). */
  solveSecondary?: SolveFn | null;
  /** nat Wolfram check. null/omitted = held for a later run, not refused (tri-state honesty). */
  wolframCheck?: WolframCheckFn | null;
}

export type PracticeItemDispatchOutcome = 'written' | 'refused' | 'parse_failed' | 'pending_retry';

export interface PracticeItemDispatchResult {
  outcome: PracticeItemDispatchOutcome;
  item?: AuthoredItem;
  spec?: PracticeItemSpec;
  reason: string;
}

const VALID_FORMATS = new Set<PracticeItemFormat>(['mcq', 'msq', 'nat']);

/**
 * Reconstructs a PracticeItemSpec from an AtomSpec's `concept_id` +
 * `prompt_vars` (`format`, `topic`, `difficulty_frac`). This is how the
 * batch pipeline threads spec details through a single JobRow without
 * adding a new field to AtomSpec — prompt_vars already exists as a
 * free-form bag for exactly this purpose.
 */
export function practiceItemSpecFromAtomSpec(atomSpec: AtomSpec): PracticeItemSpec | null {
  const format = atomSpec.prompt_vars?.format;
  const topic = atomSpec.prompt_vars?.topic;
  const difficultyFrac = atomSpec.prompt_vars?.difficulty_frac;
  if (typeof format !== 'string' || !VALID_FORMATS.has(format as PracticeItemFormat)) return null;
  if (typeof topic !== 'string' || topic.length === 0) return null;
  if (typeof difficultyFrac !== 'number' || !Number.isFinite(difficultyFrac)) return null;
  if (!atomSpec.concept_id) return null;
  return {
    concept_id: atomSpec.concept_id,
    format: format as PracticeItemFormat,
    difficulty: difficultyFrac,
    topic,
  };
}

function verificationPromptFor(questionText: string): string {
  return [
    'Independently solve the following problem. Respond with ONLY your',
    'answer (a short value or expression) — no explanation, no JSON.',
    '',
    questionText,
  ].join('\n');
}

/**
 * Dispatch one job's raw result through the practice-item pipeline.
 * `rawResult` is whatever the batch adapter parsed out of the provider's
 * JSONL row (usually a string; JSON.stringify'd if not).
 */
export async function dispatchPracticeItemJob(
  atomSpec: AtomSpec,
  rawResult: unknown,
  deps: PracticeItemDispatchDeps = {},
): Promise<PracticeItemDispatchResult> {
  const spec = practiceItemSpecFromAtomSpec(atomSpec);
  if (!spec) {
    return {
      outcome: 'refused',
      reason: 'atom_spec does not carry a valid practice-item spec (format/topic/difficulty_frac missing or malformed)',
    };
  }

  const rawText = typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult ?? null);
  const parsed = parsePracticeItemResponse(rawText, spec.format);
  if (!parsed.ok) {
    return { outcome: 'parse_failed', spec, reason: parsed.reason ?? 'unknown parse failure' };
  }
  const response = parsed.response!;

  if (spec.format === 'nat') {
    if (!deps.wolframCheck) {
      return {
        outcome: 'pending_retry',
        spec,
        reason: 'no wolframCheck wired for this run — held for a later sweep, not refused',
      };
    }
    const check = await deps.wolframCheck(response.question_text, response.correct_answer ?? '');
    if (check.status === 'inconclusive') {
      return {
        outcome: 'pending_retry',
        spec,
        reason: 'wolfram inconclusive (arbiter unavailable) — retry later, not rejected',
      };
    }
    if (check.status === 'failed') {
      return {
        outcome: 'refused',
        spec,
        reason: `wolfram disagrees: got "${check.wolfram_answer ?? 'no answer'}"`,
      };
    }
    const assembled = assemblePracticeItem(spec, response, 'wolfram_verified');
    if (!assembled.ok) {
      return { outcome: 'refused', spec, reason: assembled.reason ?? 'deriveMarking refused' };
    }
    return { outcome: 'written', spec, item: assembled.item, reason: 'wolfram-verified' };
  }

  // mcq / msq — dual-model consensus. Assemble first (deriveMarking's own
  // refusal is checked independently of the answer-key cross-check) so a
  // material that's unmarkable refuses with ITS OWN reason, not a
  // misleading "the models disagree" when they were never asked.
  const assembled = assemblePracticeItem(spec, response, verificationPathForFormat(spec.format));
  if (!assembled.ok) {
    return { outcome: 'refused', spec, reason: assembled.reason ?? 'deriveMarking refused' };
  }

  const primaryAnswer = spec.format === 'msq' ? (response.correct_answers ?? []) : (response.correct_answer ?? '');
  const dualLeg = await runDualLegAnswerCheck({
    format: spec.format,
    primaryAnswer,
    verificationPrompt: verificationPromptFor(response.question_text),
    solveSecondary: deps.solveSecondary ?? null,
  });
  if (dualLeg.refused) {
    return { outcome: 'refused', spec, reason: dualLeg.reason };
  }
  return { outcome: 'written', spec, item: assembled.item, reason: dualLeg.reason };
}
