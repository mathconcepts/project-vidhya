/**
 * src/experiments/promote-guards.ts — W1.6 anti-gaming guards.
 *
 * Three pure functions the nightly learnings-ledger runs over cohort-
 * aggregate numbers it already has in hand before flipping an experiment's
 * status to `won` and setting `canonical=true` on its targets. Each one
 * answers a narrow question a raw lift number cannot: did this "win" come
 * from something a content or teaching-policy change would produce, or
 * from a shape of behavior that looks like gaming the metric instead of
 * improving on it?
 *
 *   1. `immediateLiftFlatRetention` — the immediate mastery delta looks
 *      good, but a LATER re-measurement of the same treatment cohort shows
 *      the gain didn't hold. A real learning gain compounds or at least
 *      persists; a gain that evaporates by the next measurement is more
 *      consistent with a lucky window or a metric artifact.
 *   2. `modeSplitRegression` — MCQ accuracy rose while NAT accuracy fell.
 *      MCQ has four-option guessability; NAT does not. A treatment that
 *      only helps the guessable mode while HURTING the unguessable one is
 *      a specific, checkable gaming signature, not a specific case of
 *      general improvement.
 *   3. `speedUpErrorsUp` — students answered measurably FASTER while
 *      getting measurably MORE wrong. That is the shape of rushing
 *      (chasing a completion or streak incentive), not of a treatment that
 *      makes the material easier to get right.
 *
 * Each guard returns `{tripped, reason}` — `reason` is D8-precision: it
 * names the actual numbers, never "looks suspicious". A guard that lacks
 * enough data to judge returns `tripped: false` with a reason that says
 * so by name ('insufficient data: ...') — the honest default for a
 * DB-less deploy or a young experiment is "we can't tell", never a
 * fabricated pass OR a fabricated trip.
 *
 * Deterministic, no I/O, no clock reads beyond what the caller passes in
 * — same discipline as src/experiments/ledger-suggestions.ts, which this
 * module's `__testing` export and synthetic-fixture test style mirror.
 * Wired into the promote step of src/jobs/learnings-ledger.ts: a tripped
 * guard redirects a would-be promotion into a `run_suggestions` row for
 * operator review instead of auto-promoting, and the guard's reason is
 * named in the weekly digest.
 */

import { LATENCY_BUCKETS, type LatencyBucket } from '../gbrain/attempt-facts';

export interface GuardResult {
  tripped: boolean;
  reason: string;
}

// ============================================================================
// Guard 1 — immediate lift, flat (or negative) delayed retention
// ============================================================================

export interface ImmediateLiftFlatRetentionInput {
  /** The cached lift_v1 this experiment is being considered for promotion on. */
  liftV1: number | null;
  liftN: number | null;
  /**
   * mean(mastery in a LATER window) − mean(mastery in the PRE window) for
   * the SAME treatment cohort — "did the gain hold, further out?" — not a
   * lift-vs-control number; the immediate `liftV1` already carries the
   * control comparison. `null` when the delayed window has not been
   * measured yet (too soon after the experiment started).
   */
  delayedMasteryDelta: number | null;
  /** Sessions contributing to `delayedMasteryDelta`. */
  delayedN: number | null;
}

/** Only worth checking retention on a lift that would otherwise promote. */
const IMMEDIATE_LIFT_THRESHOLD = 0.05;
/** |delayed delta| at or below this reads as "flat", not just "smaller". */
const RETENTION_FLAT_CEILING = 0.01;
/** Below this the delayed-window sample is too thin to trust either way. */
const RETENTION_MIN_N = 20;

export function immediateLiftFlatRetention(
  input: ImmediateLiftFlatRetentionInput,
): GuardResult {
  if (input.liftV1 == null || input.liftN == null) {
    return { tripped: false, reason: 'insufficient data: experiment has no lift_v1/lift_n yet' };
  }
  if (input.liftV1 <= IMMEDIATE_LIFT_THRESHOLD) {
    return {
      tripped: false,
      reason: `lift_v1=${fmtSigned(input.liftV1)} (n=${input.liftN}) is not an immediate lift worth checking retention on (threshold ${fmtSigned(IMMEDIATE_LIFT_THRESHOLD)})`,
    };
  }
  if (input.delayedMasteryDelta == null || input.delayedN == null || input.delayedN < RETENTION_MIN_N) {
    return {
      tripped: false,
      reason: `insufficient data: delayed-window mastery has n=${input.delayedN ?? 0} sessions (need ${RETENTION_MIN_N})`,
    };
  }
  if (input.delayedMasteryDelta <= RETENTION_FLAT_CEILING) {
    return {
      tripped: true,
      reason:
        `immediate lift ${fmtSigned(input.liftV1)} (n=${input.liftN}) but the delayed-window mastery ` +
        `delta for the same cohort is ${fmtSigned(input.delayedMasteryDelta)} (n=${input.delayedN}) — ` +
        `at or below the flat ceiling of ${fmtSigned(RETENTION_FLAT_CEILING)}; the gain does not appear to hold`,
    };
  }
  return {
    tripped: false,
    reason:
      `delayed-window mastery delta ${fmtSigned(input.delayedMasteryDelta)} (n=${input.delayedN}) ` +
      `tracks the immediate lift ${fmtSigned(input.liftV1)} — retention holds`,
  };
}

// ============================================================================
// Guard 2 — MCQ accuracy up while NAT accuracy down
// ============================================================================

export interface ModeAccuracyWindow {
  kind: 'mcq' | 'nat';
  /** Accuracy (0..1) among gradable, non-skipped attempts of this kind BEFORE the experiment window. */
  accuracyPre: number | null;
  nPre: number;
  /** Accuracy (0..1) among gradable, non-skipped attempts of this kind DURING/AFTER the experiment window. */
  accuracyPost: number | null;
  nPost: number;
}

export interface ModeSplitRegressionInput {
  /** One entry per kind, from attempt_facts aggregates. Missing a kind entirely reads as insufficient data for that kind. */
  byKind: ModeAccuracyWindow[];
}

const MODE_SPLIT_MIN_N = 20;
/** MCQ accuracy must have risen by at least this much... */
const MODE_SPLIT_UP_THRESHOLD = 0.03;
/** ...while NAT accuracy fell by at least this much, for the guard to trip. */
const MODE_SPLIT_DOWN_THRESHOLD = -0.03;

export function modeSplitRegression(input: ModeSplitRegressionInput): GuardResult {
  const mcq = input.byKind.find((w) => w.kind === 'mcq');
  const nat = input.byKind.find((w) => w.kind === 'nat');

  const mcqUsable = mcq && mcq.accuracyPre != null && mcq.accuracyPost != null
    && mcq.nPre >= MODE_SPLIT_MIN_N && mcq.nPost >= MODE_SPLIT_MIN_N;
  const natUsable = nat && nat.accuracyPre != null && nat.accuracyPost != null
    && nat.nPre >= MODE_SPLIT_MIN_N && nat.nPost >= MODE_SPLIT_MIN_N;

  if (!mcqUsable || !natUsable) {
    return {
      tripped: false,
      reason:
        `insufficient data: mcq nPre=${mcq?.nPre ?? 0}/nPost=${mcq?.nPost ?? 0}, ` +
        `nat nPre=${nat?.nPre ?? 0}/nPost=${nat?.nPost ?? 0} (need ${MODE_SPLIT_MIN_N} each side, each kind)`,
    };
  }

  const mcqDelta = mcq!.accuracyPost! - mcq!.accuracyPre!;
  const natDelta = nat!.accuracyPost! - nat!.accuracyPre!;

  if (mcqDelta >= MODE_SPLIT_UP_THRESHOLD && natDelta <= MODE_SPLIT_DOWN_THRESHOLD) {
    return {
      tripped: true,
      reason:
        `MCQ accuracy ${fmtPct(mcq!.accuracyPre!)} → ${fmtPct(mcq!.accuracyPost!)} (${fmtPctDelta(mcqDelta)}, n=${mcq!.nPost}) ` +
        `while NAT accuracy ${fmtPct(nat!.accuracyPre!)} → ${fmtPct(nat!.accuracyPost!)} (${fmtPctDelta(natDelta)}, n=${nat!.nPost}) — ` +
        `guessable-mode-only gains, not general improvement`,
    };
  }
  return {
    tripped: false,
    reason: `MCQ ${fmtPctDelta(mcqDelta)} (n=${mcq!.nPost}), NAT ${fmtPctDelta(natDelta)} (n=${nat!.nPost}) — no mode-split regression`,
  };
}

// ============================================================================
// Guard 3 — answers got faster while errors went up
// ============================================================================

export interface SpeedUpErrorsUpInput {
  /** Mean latency-bucket index (0=lt10s .. 3=gt90s) for the treatment cohort BEFORE the window. */
  meanBucketIndexPre: number | null;
  /** Same, AFTER/during the window. */
  meanBucketIndexPost: number | null;
  accuracyPre: number | null;
  accuracyPost: number | null;
  /** Attempts contributing to the post-window figures (the tighter of the two samples). */
  n: number | null;
}

const SPEED_MIN_N = 20;
/** Bucket-index units (0..3). A drop of at least this much reads as "meaningfully faster". */
const SPEED_BUCKET_DROP_THRESHOLD = 0.5;
/** Accuracy must have fallen by at least this much for the guard to trip. */
const SPEED_ACCURACY_DROP_THRESHOLD = 0.05;

export function speedUpErrorsUp(input: SpeedUpErrorsUpInput): GuardResult {
  if (
    input.meanBucketIndexPre == null || input.meanBucketIndexPost == null ||
    input.accuracyPre == null || input.accuracyPost == null ||
    input.n == null || input.n < SPEED_MIN_N
  ) {
    return { tripped: false, reason: `insufficient data: n=${input.n ?? 0} attempts with both a latency bucket and a grade (need ${SPEED_MIN_N})` };
  }

  const bucketDelta = input.meanBucketIndexPost - input.meanBucketIndexPre;
  const accuracyDelta = input.accuracyPost - input.accuracyPre;

  if (bucketDelta <= -SPEED_BUCKET_DROP_THRESHOLD && accuracyDelta <= -SPEED_ACCURACY_DROP_THRESHOLD) {
    return {
      tripped: true,
      reason:
        `mean answer-latency bucket moved from ${input.meanBucketIndexPre.toFixed(2)} to ${input.meanBucketIndexPost.toFixed(2)} ` +
        `(${bucketLabel(input.meanBucketIndexPre)} → ${bucketLabel(input.meanBucketIndexPost)}) while accuracy fell from ` +
        `${fmtPct(input.accuracyPre)} to ${fmtPct(input.accuracyPost)} (n=${input.n}) — students answering faster and getting more wrong`,
    };
  }
  return {
    tripped: false,
    reason:
      `latency bucket ${input.meanBucketIndexPre.toFixed(2)} → ${input.meanBucketIndexPost.toFixed(2)}, ` +
      `accuracy ${fmtPct(input.accuracyPre)} → ${fmtPct(input.accuracyPost)} (n=${input.n}) — no speed/accuracy regression`,
  };
}

// ============================================================================
// Shared formatting — every reason names actual numbers (plan D8)
// ============================================================================

function fmtSigned(v: number): string {
  return (v >= 0 ? '+' : '') + v.toFixed(4);
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function fmtPctDelta(v: number): string {
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}pp`;
}

/** `meanBucketIndex` is a continuous interpolation over LATENCY_BUCKETS' order — label the nearest bucket for readability. */
function bucketLabel(meanIndex: number): LatencyBucket {
  const clamped = Math.max(0, Math.min(LATENCY_BUCKETS.length - 1, Math.round(meanIndex)));
  return LATENCY_BUCKETS[clamped];
}

export const __testing = {
  IMMEDIATE_LIFT_THRESHOLD,
  RETENTION_FLAT_CEILING,
  RETENTION_MIN_N,
  MODE_SPLIT_MIN_N,
  MODE_SPLIT_UP_THRESHOLD,
  MODE_SPLIT_DOWN_THRESHOLD,
  SPEED_MIN_N,
  SPEED_BUCKET_DROP_THRESHOLD,
  SPEED_ACCURACY_DROP_THRESHOLD,
};
