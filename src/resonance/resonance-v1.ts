/**
 * src/resonance/resonance-v1.ts
 *
 * Resonance Score v1 computation (Track E2).
 *
 * Formula (locked — never mutate in place; future versions = resonance_v2):
 *   resonance_v1 = 0.30·completion_rate + 0.20·dwell_fit
 *                + 0.20·(1−regen_abandon_rate) + 0.15·rating_score
 *                + 0.15·mastery_share
 *
 * Pure functions only — all I/O (DB reads, DB writes) lives in resonance-job.ts.
 */

import type { ResonanceComponents, ResonanceScore, ShadowModeStatus } from './types.js';

// ---------------------------------------------------------------------------
// Weight constants (locked with the formula)
// ---------------------------------------------------------------------------

export const WEIGHTS = {
  completion_rate: 0.30,
  dwell_fit: 0.20,
  regen_persist: 0.20,       // weight on (1 - regen_abandon_rate)
  rating_score: 0.15,
  mastery_share: 0.15,
} as const;

export const K_ANON_FLOOR = 30;
export const SHADOW_MIN_WEEKS = 2;
export const SHADOW_MIN_TURNS = 500;

// ---------------------------------------------------------------------------
// Core computation
// ---------------------------------------------------------------------------

/**
 * Compute resonance_v1 from raw components.
 * Returns null if n < K_ANON_FLOOR (insufficient data for k-anon floor).
 */
export function computeResonanceV1(
  components: ResonanceComponents,
  n: number,
): number | null {
  if (n < K_ANON_FLOOR) return null;

  const score =
    WEIGHTS.completion_rate * clamp01(components.completion_rate) +
    WEIGHTS.dwell_fit * clamp01(components.dwell_fit) +
    WEIGHTS.regen_persist * clamp01(1 - components.regen_abandon_rate) +
    WEIGHTS.rating_score * clamp01(components.rating_score) +
    WEIGHTS.mastery_share * clamp01(components.mastery_share);

  return Math.round(score * 10000) / 10000; // 4 decimal places
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Normalise raw rating counts to a 0–1 score.
 * rating_score = (helped_count + 1) / (total_count + 2)  (Laplace smoothing)
 */
export function normaliseRatingScore(helped: number, total: number): number {
  if (total === 0) return 0.5; // no data → neutral
  return (helped + 1) / (total + 2);
}

/**
 * Dwell fit: actual dwell time vs estimated read time (in seconds).
 * Score = 1 if dwell >= estimated; decays linearly to 0 at 0 dwell.
 * Capped at 1 even if dwell >> estimated (we only care about minimum engagement).
 */
export function computeDwellFit(avgDwellSeconds: number, estimatedReadSeconds: number): number {
  if (estimatedReadSeconds <= 0) return 0.5;
  return clamp01(avgDwellSeconds / estimatedReadSeconds);
}

// ---------------------------------------------------------------------------
// Shadow mode
// ---------------------------------------------------------------------------

export function checkShadowMode(
  weeksOfData: number,
  totalScoredTurns: number,
): ShadowModeStatus {
  const exit_criterion_met =
    weeksOfData >= SHADOW_MIN_WEEKS && totalScoredTurns >= SHADOW_MIN_TURNS;
  return {
    active: !exit_criterion_met,
    weeks_of_data: weeksOfData,
    total_scored_turns: totalScoredTurns,
    exit_criterion_met,
  };
}

// ---------------------------------------------------------------------------
// Suggestion generation (pure)
// ---------------------------------------------------------------------------

import type { ResonanceSuggestion } from './types.js';

export function generateResonanceSuggestions(
  scores: ResonanceScore[],
): ResonanceSuggestion[] {
  const suggestions: ResonanceSuggestion[] = [];

  for (const score of scores) {
    if (score.resonance_v1 === null) continue;
    if (score.shadow_mode) continue;

    const r = score.resonance_v1;
    const n = score.n;
    const c = score.components;

    if (r < 0.35 && n >= K_ANON_FLOOR) {
      suggestions.push({
        kind: 'rewrite_low_resonance',
        atom_id: score.atom_id,
        resonance_v1: r,
        n,
        rationale: `resonance_v1=${r.toFixed(3)} < 0.35 with n=${n} — atom underperforming`,
      });
    } else if (
      c &&
      c.completion_rate < 0.40 &&
      c.dwell_fit > 0.70 &&
      n >= K_ANON_FLOOR
    ) {
      suggestions.push({
        kind: 'modality_mismatch',
        atom_id: score.atom_id,
        resonance_v1: r,
        n,
        rationale:
          `completion_rate=${c.completion_rate.toFixed(2)} low, dwell_fit=${c.dwell_fit.toFixed(2)} high — students read but don't engage; consider modality switch`,
      });
    } else if (r >= 0.75 && n >= K_ANON_FLOOR) {
      suggestions.push({
        kind: 'pattern_win',
        atom_id: score.atom_id,
        resonance_v1: r,
        n,
        rationale: `resonance_v1=${r.toFixed(3)} >= 0.75 with n=${n} — strong signal; extract pedagogy pattern`,
      });
    }
  }

  return suggestions;
}
