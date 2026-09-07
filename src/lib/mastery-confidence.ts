/**
 * mastery-confidence.ts
 *
 * A raw correct/attempts ratio is a maximum-likelihood point estimate with
 * no regard for sample size — 1/1 and 800/1000 both read "100%". Root cause
 * of a live-QA report (/investigate, 2026-09-07: "sample size is too low to
 * be completed 100%"): the Progress page's per-topic mastery bar and the
 * Exam Readiness Score both computed exactly this naive ratio in
 * `src/api/gate-routes.ts` (`handleGetProgress`, `handleExamReadiness`),
 * gated only by `attempts > 0` — so a topic with one lucky correct answer
 * displayed a confident "100%", identical to a topic actually mastered
 * over dozens of attempts.
 *
 * The codebase already has a family of ad-hoc minimum-n thresholds tuned to
 * their own stakes — `cross-exam-coverage.ts`'s `MIN_ATTEMPTS = 2`,
 * `session-engine.ts`'s `STRONG_MIN_ATTEMPTS = 2`,
 * `attempt-counterfactual.ts`'s `MIN_TOPIC_ATTEMPTS_FOR_SKIP_EV = 8`,
 * `gbrain/elo.ts`'s `ITEM_CONFIDENT_N = 100`, `experiments/lift.ts`'s
 * `n >= 30` promotion floor — but every one of them gates whether a signal
 * is USED at all, never what NUMBER a student is shown. This module is the
 * general-purpose fix for "what number do we display": the Wilson score
 * interval lower bound, the standard, well-studied correction for exactly
 * this failure mode (the same math behind, e.g., Reddit's "best" comment
 * ranking — see Evan Miller, "How Not To Sort By Average Rating"). It
 * shrinks toward 0 the fewer trials there are and converges to the raw
 * ratio as trials grow, so 1/1 now displays an honest ~21%, not a
 * misleadingly confident 100% — the interval is wide because one data
 * point tells you almost nothing, and a LOWER bound is the conservative,
 * never-overclaim choice for a number a student reads as "how ready am I."
 *
 * Deliberately NOT migrated in this pass, named honestly rather than
 * silently expanded: `cross-exam-coverage.ts`, `session-engine.ts`, and
 * `attempt-counterfactual.ts` already have their own min-n gates serving
 * their own purposes (coverage rollups, session highlight labels, EV
 * estimation) and are left untouched here — swapping their raw ratios for
 * a Wilson bound too is a broader, separate refactor with its own blast
 * radius, not part of this fix. See TODOS.md.
 */

/** z-score for a 95% two-sided confidence interval. */
export const WILSON_Z_95 = 1.959963984540054;

/**
 * Wilson score interval lower bound for a binomial proportion `successes/trials`.
 * Returns 0 for zero trials — no data, no confidence, full stop. Monotonically
 * approaches `successes/trials` as `trials` grows (the correction fades exactly
 * when it's no longer needed).
 */
export function wilsonLowerBound(successes: number, trials: number, z: number = WILSON_Z_95): number {
  if (trials <= 0) return 0;
  const n = trials;
  const p = Math.min(1, Math.max(0, successes / trials));
  const z2 = z * z;
  const denominator = 1 + z2 / n;
  const center = p + z2 / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return Math.max(0, Math.min(1, (center - margin) / denominator));
}

export type MasteryConfidence = 'none' | 'low' | 'medium' | 'high';

/**
 * Below this many attempts, a topic gets no mastery LABEL at all (no
 * "mastered" / "weak" badge language) — just an honest "not enough
 * attempts yet" caption. Set between this codebase's existing n=2
 * ("covered", a soft rollup signal) and n=8 ("skip-EV", a real decision) —
 * a per-topic badge a student reads as "you know this" carries closer to
 * the latter's stakes than the former's.
 */
export const MASTERY_MIN_ATTEMPTS_FOR_LABEL = 5;

/**
 * At or above this many attempts, the Wilson bound sits close enough to the
 * raw ratio that the displayed number can be shown with full confidence
 * styling (no "still gathering data" caveat needed).
 */
export const MASTERY_HIGH_CONFIDENCE_ATTEMPTS = 15;

export interface TopicMasteryDisplay {
  /** The conservative, small-sample-honest percentage to SHOW (0-100), via Wilson lower bound. */
  displayPct: number;
  /** The naive correct/attempts percentage (0-100) — kept for callers that need the raw ratio for their own already-gated purpose. */
  rawPct: number;
  attempts: number;
  confidence: MasteryConfidence;
  /** True once `attempts >= MASTERY_MIN_ATTEMPTS_FOR_LABEL` — a mastery badge/label may be shown; below this, only the raw attempt count is honest. */
  hasEnoughDataForLabel: boolean;
}

export function topicMasteryDisplay(correct: number, attempts: number): TopicMasteryDisplay {
  const rawPct = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
  const displayPct = Math.round(wilsonLowerBound(correct, attempts) * 100);
  const confidence: MasteryConfidence =
    attempts === 0 ? 'none' :
    attempts < MASTERY_MIN_ATTEMPTS_FOR_LABEL ? 'low' :
    attempts < MASTERY_HIGH_CONFIDENCE_ATTEMPTS ? 'medium' : 'high';
  return {
    displayPct,
    rawPct,
    attempts,
    confidence,
    hasEnoughDataForLabel: attempts >= MASTERY_MIN_ATTEMPTS_FOR_LABEL,
  };
}
