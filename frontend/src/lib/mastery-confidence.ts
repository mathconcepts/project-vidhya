/**
 * mastery-confidence.ts (frontend mirror of `src/lib/mastery-confidence.ts`,
 * the backend source of truth — kept in sync manually, the same pattern
 * `frontend/src/lib/ledger-suggestions.ts` already uses for a backend
 * module the frontend can't statically import).
 *
 * The backend already returns a Wilson-bound `mastery` + `masteryConfidence`
 * per topic (see `/api/progress/:sessionId`), so most of the Progress page
 * doesn't need this file at all — it exists only for the one client-side
 * aggregate the backend doesn't pre-compute: the top "Accuracy" stat tile,
 * derived from `overall.total_correct`/`total_attempts`. Keeping the same
 * formula here (not a re-derivation) is what makes that tile agree with the
 * per-topic bars below it instead of silently using a different, naive
 * ratio the way it did before /investigate (2026-09-07).
 */

const WILSON_Z_95 = 1.959963984540054;

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

/** Mirrors the backend's `MASTERY_MIN_ATTEMPTS_FOR_LABEL` — kept as a literal, not imported, per the file-header note. */
export const MASTERY_MIN_ATTEMPTS_FOR_LABEL = 5;
