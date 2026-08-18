/**
 * src/scoring/difficulty-elo.ts — the ONE shared 0..1 difficulty → Elo
 * mapping, and the ONE shared `examRelevance` default, for every
 * LearningObjectCatalog implementation.
 *
 * Outside-voice amendment T21 (docs/designs/linear-algebra-realtime-and-
 * math-academy-plan.md, "second outside voice", finding 4): the pg catalog
 * and the file catalog had drifted onto two different mappings —
 * `600 + 1800·d` (pg) vs `800 + 1400·d` (file) — with the file catalog's
 * own comment claiming it "mirrors pg", which was false. Two mappings for
 * the same 0..1 column means the SAME authored difficulty resolves to a
 * DIFFERENT Elo band depending on which catalog served the item, silently
 * biasing ProtoCATSelector's success-band filtering by catalog origin
 * rather than by the content itself.
 *
 * `800..2200` is the mapping kept: it aligns with the diagnostic warmup's
 * bracket range (`src/readiness/diagnostic-warmup.ts` walks 800–2100), so
 * an authored item at difficulty 1.0 lands inside the same band the warmup
 * already probes, rather than reaching into a nominal 2400 no diagnostic
 * ever visits.
 *
 * `examRelevance` had the same drift: pg defaulted 0.5, file defaulted 1.0
 * — `scoreCandidate` in proto-cat-selector.ts multiplies by this value
 * directly, so identical items served from different catalogs got a 2×
 * selection-weight bias with no content difference behind it. One default
 * for both.
 */

/** Elo-scale bounds the 0..1 `difficulty` column rescales into. */
export const DIFFICULTY_ELO_FLOOR = 800;
export const DIFFICULTY_ELO_SPAN = 1400; // ceiling = 800 + 1400 = 2200

/** Shared default when a catalog row/item has no exam-relevance signal. */
export const DEFAULT_EXAM_RELEVANCE = 1.0;

/** 0..1 difficulty → Elo scale (800..2200). Clamps out-of-range/NaN input to [0,1]. */
export function difficultyToElo(d: number): number {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(d) ? d : 0.5));
  return DIFFICULTY_ELO_FLOOR + clamped * DIFFICULTY_ELO_SPAN;
}

/**
 * Inverse of difficultyToElo, clamped to [0, 1]. Callers pass Elo-scale
 * bounds (e.g. proto-cat-selector.ts's diffMin/diffMax); this translates
 * them back to the 0..1 column scale for a SQL WHERE clause or an
 * in-memory filter.
 */
export function eloToDifficultyBounds(diffMin?: number, diffMax?: number): { lo: number; hi: number } {
  const toFrac = (e: number) =>
    Math.max(0, Math.min(1, (e - DIFFICULTY_ELO_FLOOR) / DIFFICULTY_ELO_SPAN));
  return {
    lo: diffMin !== undefined ? toFrac(diffMin) : 0,
    hi: diffMax !== undefined ? toFrac(diffMax) : 1,
  };
}
