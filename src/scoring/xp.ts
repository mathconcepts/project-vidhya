/**
 * src/scoring/xp.ts — T14 (B5): personal XP semantics, pure functions only.
 *
 * "1 XP ≈ 1 minute of focused effort" (locked plan, B5). XP is PERSONAL-ONLY:
 * no leagues, no peer comparison, no rank/percentile fields anywhere
 * (surveillance invariant 10 extends to XP — see
 * src/personalization/__tests__/surveillance-invariants.test.ts, invariant 11).
 * The student-facing form speaks MINUTES; "XP" stays the internal unit name
 * in code/API only (DR-4).
 *
 * Award rule: XP scales with the item's estimated minutes, in proportion to
 * the SIGNED marks ratio actually earned (grade.earned / grade.max) — a
 * correct answer earns close to the full estMinutes, a wrong MCQ under GATE
 * negative marking earns a negative amount (mirroring the negative mark),
 * and MSQ/NAT wrong answers earn 0 (GATE never penalizes those kinds).
 * Skipped attempts are never awarded (the caller simply doesn't call this
 * for a skip) — "none on skip" is enforced by NOT producing an event, not by
 * clamping to zero, so the ledger stays an honest record of what happened.
 *
 * Negative events are written to the ledger for an honest audit trail, but
 * are NEVER surfaced to the student individually (no "-2 min" award line —
 * see xp-store's totalXpMinutes(), which floors the running total at 0 so
 * a mistake can never make the visible meter go backwards) and never
 * summed into any cohort/peer view (there is no such view — invariant 11).
 */

/** Quiz offered every N XP-minutes of focused work (B5, "start N=100"). */
export const QUIZ_XP_THRESHOLD_MINUTES = 100;

/** 4–6 items per checkpoint quiz (DR-3 wireframe: "6 questions"). */
export const QUIZ_LENGTH = 6;

/** Pool must hold at least this multiple of the quiz length to be offered (amendment #9). */
export const QUIZ_POOL_MULTIPLE = 2;

/** No item is re-served within this many days of its last review (amendment #9, OV2-D4). */
export const QUIZ_NO_REPEAT_WINDOW_DAYS = 14;

/** ~80s/item budgets a 6-item quiz at "about 8 minutes" (DR-3 pre-quiz framing copy). */
export const QUIZ_SECONDS_PER_ITEM = 80;

export interface XpGradeInput {
  earned: number;
  max: number;
}

/**
 * XP for one graded (non-skipped) attempt. `estMinutes` is the item's own
 * estimate (LearningObject.estMinutes) — the "focused effort" the item was
 * expected to cost, scaled by how much of the available marks were earned.
 * Rounds to the nearest whole minute; a max of 0 (malformed item) earns 0
 * rather than dividing by zero.
 */
export function xpForAttempt(grade: XpGradeInput, estMinutes: number): number {
  if (!(grade.max > 0) || !(estMinutes > 0)) return 0;
  const ratio = grade.earned / grade.max; // can be negative (wrong MCQ, negative marking)
  return Math.round(estMinutes * ratio);
}

/** True once a student's floored total reaches the quiz threshold. */
export function meetsQuizThreshold(totalMinutes: number, threshold: number = QUIZ_XP_THRESHOLD_MINUTES): boolean {
  return totalMinutes >= threshold;
}
