/**
 * src/personalization/
 *
 * The PersonalizedSelector — Phase A of the personalization plan.
 *
 *   selector  — the public entry: applyPersonalizedRanking(atoms, ctx)
 *   ab        — A/B bucketing helpers + experiment id constant
 *   types     — shared types
 *
 * Eng-review locked invariants (see __tests__/surveillance-invariants.test.ts):
 *   1. No new schema columns added by this module
 *   2. realtime-nudge.ts contains no DB writes
 *   3. No public route exposes per-atom personalization scores
 *   4. No frontend file imports from this module
 */

export { applyPersonalizedRanking } from './selector';
export { bucketFor, hashToUnit, PERSONALIZED_SELECTOR_EXPERIMENT_ID } from './ab';
export { LAYER_WEIGHTS } from './types';
export type {
  AtomShape,
  RankingContext,
  ScoredAtom,
  PersonalizedSelectorFn,
} from './types';
