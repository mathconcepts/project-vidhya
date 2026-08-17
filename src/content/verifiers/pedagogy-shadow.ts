/**
 * Shadow mode for the pedagogy gate.
 *
 * The Tier 4 verifier has run in shadow since the day it was written and has
 * never been switched on, because switching it on means picking a threshold
 * and nobody has ever seen the score distribution. `VIDHYA_PEDAGOGY_THRESHOLD`
 * defaults to 0.65 — a number chosen before any content was scored.
 *
 * This is the same shape `fsrs-shadow.ts` used to answer the same question for
 * the scheduler swap: log what the gate WOULD have decided, publish the
 * distribution, and flip on a number rather than on a feeling.
 *
 * ── Three things this has to get right ──────────────────────────────────
 *
 * 1. AN ERROR IS NOT A ZERO.
 *    `pedagogyVerifier.verify` returns `score: 0` when the judge throws AND
 *    when it returns malformed output. With no reachable LLM provider that is
 *    every call, so a naive distribution over 82 rows would be 82 zeros —
 *    indistinguishable from content that is genuinely terrible, and it would
 *    argue for a threshold of zero. Errored rows are recorded, counted, and
 *    then excluded from every statistic.
 *
 * 2. SCORE WHAT THE GATE ACTUALLY GATES.
 *    `pedagogyVerifier` has one production caller,
 *    `curriculum-unit-orchestrator.ts`, and it scores curriculum UNITS.
 *    Flipping `VIDHYA_PEDAGOGY_GATE` therefore gates unit generation. Scoring
 *    the 82 prose explainers instead would publish a distribution about one
 *    population and enforce it on another. The rubric agrees: 0.30 of its
 *    weight is `interactive_correctness` + `distractor_quality`, which prose
 *    explainers have no way to earn.
 *
 * 3. A SMALL SAMPLE IS NOT A DISTRIBUTION.
 *    The criterion requires a minimum count before it will report ready, so
 *    "we scored four units and they all passed" cannot unlock the gate.
 */

/** One shadow observation. Diagnostic only, freely truncatable. */
export interface PedagogyShadowRow {
  /** Unit or atom the score belongs to. */
  target_id: string;
  concept_id?: string;
  /** Weighted rubric total in [0,1]. Meaningless when `errored` is true. */
  score: number;
  /**
   * True when the judge could not answer — threw, timed out, or returned
   * something unparseable. The verifier reports `score: 0` in these cases,
   * which is why the flag exists rather than being inferred from the score.
   */
  errored: boolean;
  reason?: string;
}

/** What an operator reads before deciding to flip the gate. */
export interface PedagogyDistribution {
  /** Rows recorded, including errors. */
  observed: number;
  /** Rows the statistics are computed over. */
  scored: number;
  errored: number;
  error_rate: number;
  p10: number | null;
  p50: number | null;
  p90: number | null;
  min: number | null;
  max: number | null;
  /** Share of scored rows a given threshold would have blocked. */
  would_block_at(threshold: number): number;
}

/**
 * The threshold the gate uses today, mirrored here for the readout.
 *
 * Duplicated deliberately rather than imported: `pedagogy-verifier.ts` pulls
 * in the LLM runtime at module load, and this module is meant to stay pure so
 * the criterion is testable with no provider and no database. A test asserts
 * the two agree.
 */
export const DEFAULT_SHADOW_THRESHOLD = 0.65;

/** Minimum scored rows before the distribution is treated as informative. */
export const MIN_SCORED_FOR_CRITERION = 30;

/**
 * Highest share of scored content the gate may block and still be considered
 * a quality gate rather than an outage. A gate that refuses most of what the
 * pipeline produces is not measuring quality, it is off.
 */
export const MAX_BLOCK_RATE = 0.2;

/** Above this, the judge is not answering and the numbers mean nothing. */
export const MAX_ERROR_RATE = 0.1;

function quantile(sorted: number[], q: number): number | null {
  if (sorted.length === 0) return null;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function summarize(rows: PedagogyShadowRow[]): PedagogyDistribution {
  const errored = rows.filter((r) => r.errored);
  const scored = rows.filter((r) => !r.errored).map((r) => r.score).sort((a, b) => a - b);

  return {
    observed: rows.length,
    scored: scored.length,
    errored: errored.length,
    error_rate: rows.length === 0 ? 0 : errored.length / rows.length,
    p10: quantile(scored, 0.1),
    p50: quantile(scored, 0.5),
    p90: quantile(scored, 0.9),
    min: scored.length ? scored[0] : null,
    max: scored.length ? scored[scored.length - 1] : null,
    would_block_at(threshold: number): number {
      if (scored.length === 0) return 0;
      return scored.filter((s) => s < threshold).length / scored.length;
    },
  };
}

export interface FlipVerdict {
  ready: boolean;
  /** Threshold the data supports, or null when it supports none. */
  suggested_threshold: number | null;
  blockers: string[];
}

/**
 * Whether the gate may be switched on, and at what threshold.
 *
 * Deliberately returns a threshold DERIVED from the observed distribution
 * rather than validating the hardcoded 0.65. Picking the number first and
 * checking it later is how 0.65 came to exist without evidence.
 */
export function flipVerdict(
  rows: PedagogyShadowRow[],
  opts: { maxBlockRate?: number; minScored?: number; maxErrorRate?: number } = {},
): FlipVerdict {
  const maxBlock = opts.maxBlockRate ?? MAX_BLOCK_RATE;
  const minScored = opts.minScored ?? MIN_SCORED_FOR_CRITERION;
  const maxError = opts.maxErrorRate ?? MAX_ERROR_RATE;

  const d = summarize(rows);
  const blockers: string[] = [];

  if (d.scored < minScored) {
    blockers.push(`only ${d.scored} scored observations, need ${minScored}`);
  }
  if (d.error_rate > maxError) {
    blockers.push(
      `judge error rate ${(d.error_rate * 100).toFixed(0)}% exceeds ${(maxError * 100).toFixed(0)}% — ` +
        'the scores that did come back are not a sample of anything',
    );
  }

  // The threshold that blocks exactly the weakest `maxBlock` share. Below the
  // 10th percentile there is not enough resolution to place it meaningfully.
  const suggested = blockers.length === 0 ? quantile(
    rows.filter((r) => !r.errored).map((r) => r.score).sort((a, b) => a - b),
    maxBlock,
  ) : null;

  return {
    ready: blockers.length === 0 && suggested !== null,
    suggested_threshold: suggested === null ? null : Number(suggested.toFixed(3)),
    blockers,
  };
}

/**
 * Turn a verifier result into a shadow row.
 *
 * The errored flag is read from the reason string because that is the only
 * signal `ContentVerifierResult` carries — it has `passed`, `score` and
 * `reason` and nothing else, and widening that interface would touch every
 * other verifier that implements it.
 */
export function rowFromResult(
  target_id: string,
  result: { score: number; reason?: string },
  concept_id?: string,
): PedagogyShadowRow {
  const reason = result.reason ?? '';
  const errored =
    reason.startsWith('pedagogy-verifier-error:') ||
    reason === 'pedagogy-verifier-malformed-llm-output';
  return { target_id, concept_id, score: result.score, errored, reason: reason || undefined };
}
