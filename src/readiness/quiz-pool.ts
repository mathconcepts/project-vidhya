/**
 * src/readiness/quiz-pool.ts — T14 (B5): checkpoint quiz pool assembly +
 * selection. Pure functions over already-fetched rows (mirrors the
 * pure-core / impure-edge split in due-cards.ts) so the pool-protection
 * rules — no-repeat window, within-quiz dedup, 2× depth gate — are unit
 * tested without a database (amendment #9, OV2-D4).
 *
 * Pool sources (locked): due FSRS reviews (reps > 0, via due-cards.ts) +
 * frontier concepts via the existing catalog. NO new serve-log table —
 * rendered-but-unattempted items are not tracked, by surveillance-
 * discipline choice (OV2-D4 #9). The no-repeat window instead reads
 * `fsrs_cards.last_review_at` — a card is only ever touched by an actual
 * graded attempt, never by being merely offered.
 */

import { QUIZ_LENGTH, QUIZ_POOL_MULTIPLE } from '../scoring/xp';

export interface QuizPoolCandidate {
  objectId: string;
  skillId: string;
  source: 'due' | 'frontier';
}

/**
 * Merge due-review rows and frontier-concept catalog rows into a single
 * deduplicated pool, excluding anything reviewed within the no-repeat
 * window. On an id collision `due` wins (it's the higher-signal source —
 * an item that's both overdue AND in a frontier concept is still exactly
 * one quiz slot).
 */
export function assembleQuizPool(
  dueRows: ReadonlyArray<{ objectId: string; skillId: string | null }>,
  frontierRows: ReadonlyArray<{ objectId: string; skillId: string }>,
  recentlyReviewed: ReadonlySet<string>,
): QuizPoolCandidate[] {
  const byId = new Map<string, QuizPoolCandidate>();

  for (const row of dueRows) {
    if (!row.skillId) continue;
    if (recentlyReviewed.has(row.objectId)) continue;
    byId.set(row.objectId, { objectId: row.objectId, skillId: row.skillId, source: 'due' });
  }
  for (const row of frontierRows) {
    if (byId.has(row.objectId)) continue; // due already claimed this slot
    if (recentlyReviewed.has(row.objectId)) continue;
    byId.set(row.objectId, { objectId: row.objectId, skillId: row.skillId, source: 'frontier' });
  }

  return [...byId.values()];
}

/**
 * The pool-depth gate (amendment #9): offered only when the eligible pool
 * holds at least `QUIZ_POOL_MULTIPLE`× the quiz length. Below that, the
 * offer row must read the honest empty state — never a padded quiz.
 */
export function quizIsEligible(poolSize: number, quizLength: number = QUIZ_LENGTH): boolean {
  return poolSize >= QUIZ_POOL_MULTIPLE * quizLength;
}

/**
 * Deterministic Fisher–Yates sample of `quizLength` DISTINCT candidates
 * from the (already deduplicated) pool — within-quiz-session dedup falls
 * out structurally from sampling without replacement over a Map-deduped
 * pool. `rng` is injected (mulberry32 in production callers, per the
 * repo's no-Math.random discipline for anything seed-reproducible) so
 * tests can pin the exact draw; production call sites may also pass
 * `Math.random` when a fresh random quiz composition each time is fine
 * (there is no reproducibility requirement on WHICH quiz a student gets,
 * only that IT never repeats an item within itself or the 14-day window).
 */
export function selectQuizItems(
  pool: ReadonlyArray<QuizPoolCandidate>,
  quizLength: number,
  rng: () => number,
): QuizPoolCandidate[] {
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(quizLength, arr.length));
}
