/**
 * src/generation/practice-item-factory/types.ts — E9 practice-item factory
 * (docs/designs/linear-algebra-realtime-and-math-academy-plan.md, A7/T7).
 *
 * Locked v1 shapes for the offline pipeline:
 *   PracticeItemSpec — the operator's REQUEST (what to generate).
 *   PracticeItemGenerationResponse — the strict JSON contract the LLM must
 *     satisfy (parse.ts refuses anything else).
 *
 * Every module in this directory is pure / fixture-driven — no network,
 * no LLM calls. The live wiring (real provider calls) is a follow-up an
 * operator runs with a provider key; this directory only has to be
 * CORRECT when driven by fixtures, per the Lane D scope of this task.
 */

import type { ErrorTag } from '../../core/interfaces';

/** GATE item kinds this factory can author. Mirrors deterministic-scorer.ts's GateItemKind. */
export type PracticeItemFormat = 'mcq' | 'msq' | 'nat';

/**
 * What the operator (or an automated floor-gap suggestion, per outside-voice
 * amendment 12 — "the factory is an installed routine") asks the factory to
 * produce. `difficulty` is the 0..1 AUTHORED difficulty — the same column
 * `difficulty-elo.ts` rescales into Elo — not the LLM's own self-report.
 */
export interface PracticeItemSpec {
  concept_id: string;
  format: PracticeItemFormat;
  /** 0..1, authored/requested difficulty. */
  difficulty: number;
  topic: string;
  /**
   * W3.4/E2 gate — mcq only. When true, assemble.ts refuses (rather than
   * writes) an mcq whose distractors are not ALL tagged with a failure
   * hypothesis (deriveMarking()'s `distractorFailureTags`). Off by
   * default: existing/legacy generation is unaffected — this is a
   * generation-side GATE, not yet a hard refusal across the board (wave-1
   * runs turn it on deliberately, per the plan).
   */
  require_failure_tags?: boolean;
}

/**
 * The strict JSON shape a generation call must return. Every field is
 * required by parse.ts — a response missing or malforming any of them is
 * refused, never guessed (deriveMarking's own "refuse, don't fabricate"
 * discipline extends one layer up, to the raw generation response).
 *
 * `correct_answer` is used for mcq/nat; `correct_answers` for msq — the
 * unused one of the pair is simply absent, not null (parse.ts checks the
 * one the spec's format actually needs).
 *
 * `difficulty` here is the MODEL's own self-reported difficulty (0..1),
 * kept for provenance/logging only — assemble.ts authors the shipped
 * item's difficulty from the SPEC's requested difficulty, not this field,
 * because the operator's request is deterministic and the model's
 * self-report is not something anything downstream should have to trust.
 */
export interface PracticeItemGenerationResponse {
  question_text: string;
  correct_answer?: string;
  correct_answers?: string[];
  distractors: string[];
  solution_steps: string[];
  difficulty: number;
  /**
   * W3.4/E2, mcq only, optional. Per-distractor failure hypothesis, keyed
   * by the exact distractor text (as it appears in `distractors`, before
   * trim/dedup). Threaded into deriveMarking()'s `distractorFailureTags`
   * unchanged — see that function's doc comment for how tags survive
   * dedup and land on POST-shuffle indices. Server-only diagnostic data;
   * see the leak tests on the render-safe serialization paths.
   */
  distractor_failure_tags?: Record<string, ErrorTag>;
}

/** How an item earned its `verification_method` stamp (assemble.ts). */
export type PracticeItemVerificationPath = 'dual_model_consensus' | 'wolfram_verified';
