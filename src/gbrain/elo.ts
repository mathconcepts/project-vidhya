/**
 * src/gbrain/elo.ts — Elo ability/difficulty rating.
 *
 * Phase 1 of the 100x Blueprint (§3.1, D1). Joint online estimation of
 * each student's ability per skill AND each item's difficulty, from the
 * same binary correct/incorrect signal. No training infrastructure, no
 * GPU, no calibration runs — a few lines of arithmetic that updates on
 * every attempt.
 *
 * Why Elo and not DKT/SAKT/AKT? See blueprint §3.1: deep KT needs
 * six-figure interaction logs. Elo cold-starts gracefully, is
 * interpretable, and produces difficulty estimates that feed the
 * proto-CAT selector. Deep models are deferred to Phase 4 behind the
 * same StudentModel interface.
 *
 * Guardrails (§3.1):
 *   - Don't trust an item's difficulty until ~100+ responses.
 *   - Use a slower K-factor on item difficulty than on student ability
 *     (items get many responses, students few — items should drift less).
 *   - Returned `confidence` reflects effective sample size.
 *
 * Pure functions — caller persists the new ratings.
 */

import type { Ability, SkillId, ObjectId, StudentId } from '../core/interfaces';

// ────────────────────────────────────────────────────────────────────
// Constants — tuneable but locked here so callers can't drift them.
// ────────────────────────────────────────────────────────────────────

/** Starting Elo rating. 1500 is the canonical "average" anchor. */
export const ELO_INITIAL = 1500;

/** K-factor: how aggressively a single attempt moves a rating. */
export const K_STUDENT = 32;          // student moves quickly — few attempts each
export const K_ITEM = 8;              // items move slowly — many attempts each

/** Below this n, treat the rating as low-confidence. */
export const CONFIDENT_N = 30;
export const ITEM_CONFIDENT_N = 100;  // per §3.1

// ────────────────────────────────────────────────────────────────────
// Core math
// ────────────────────────────────────────────────────────────────────

/**
 * Expected success probability for a student at `ability` against an
 * item at `difficulty`. Classic Elo formula — every 400 rating points
 * means 10:1 odds.
 */
export function expectedSuccess(ability: number, difficulty: number): number {
  return 1 / (1 + Math.pow(10, (difficulty - ability) / 400));
}

/**
 * Single Elo update for a (student, item) attempt.
 *
 * Returns the new ratings PLUS the expected success at the moment of
 * the attempt (callers may want it for "I expected you to get this
 * 80% — the slip cost you marks" feedback).
 */
export function updateElo(args: {
  studentRating: number;
  itemRating: number;
  correct: boolean;
  kStudent?: number;
  kItem?: number;
}): {
  newStudentRating: number;
  newItemRating: number;
  expected: number;
} {
  const { studentRating, itemRating, correct } = args;
  const kS = args.kStudent ?? K_STUDENT;
  const kI = args.kItem ?? K_ITEM;

  const expected = expectedSuccess(studentRating, itemRating);
  const score = correct ? 1 : 0;
  const delta = score - expected;

  return {
    newStudentRating: studentRating + kS * delta,
    newItemRating: itemRating - kI * delta,       // mirror update for the item
    expected,
  };
}

/**
 * Confidence in a rating given the effective sample size that produced it.
 * Maps n → [0..1] using a saturating curve: ~0.5 at n=10, ~0.9 at n=60.
 * Cheap and monotonic; not statistically rigorous — the cockpit uses it
 * for traffic-light UI, not for inference.
 */
export function confidenceFromN(n: number, target = CONFIDENT_N): number {
  if (n <= 0) return 0;
  // Saturating: c = n / (n + target/2)
  return Math.min(1, n / (n + target / 2));
}

// ────────────────────────────────────────────────────────────────────
// In-memory state shapes (storage is the caller's problem)
// ────────────────────────────────────────────────────────────────────

export interface StudentAbilityState {
  studentId: StudentId;
  skillId: SkillId;
  rating: number;
  n: number;
}

export interface ItemDifficultyState {
  objectId: ObjectId;
  skillId: SkillId;
  rating: number;
  n: number;
}

export function newStudentAbility(
  studentId: StudentId,
  skillId: SkillId,
  initial = ELO_INITIAL
): StudentAbilityState {
  return { studentId, skillId, rating: initial, n: 0 };
}

export function newItemDifficulty(
  objectId: ObjectId,
  skillId: SkillId,
  initial = ELO_INITIAL
): ItemDifficultyState {
  return { objectId, skillId, rating: initial, n: 0 };
}

/**
 * Apply one attempt to in-memory state. Mutates and returns the same
 * objects for ergonomic chaining; caller persists. Idempotency on
 * (studentId, objectId, ts) MUST be handled by the caller — Elo math
 * itself is not idempotent on duplicate attempts.
 */
export function applyAttempt(
  student: StudentAbilityState,
  item: ItemDifficultyState,
  correct: boolean
): { student: StudentAbilityState; item: ItemDifficultyState; expected: number } {
  const { newStudentRating, newItemRating, expected } = updateElo({
    studentRating: student.rating,
    itemRating: item.rating,
    correct,
  });
  student.rating = newStudentRating;
  student.n += 1;
  item.rating = newItemRating;
  item.n += 1;
  return { student, item, expected };
}

/**
 * Render a StudentAbilityState as the Ability interface used by the
 * StudentModel contract.
 */
export function toAbility(s: StudentAbilityState): Ability {
  return {
    rating: s.rating,
    confidence: confidenceFromN(s.n),
    n: s.n,
  };
}

/**
 * Is this item's difficulty trustworthy enough to use for adaptive
 * selection? Per §3.1, demand ~100 responses.
 */
export function itemDifficultyTrustworthy(item: ItemDifficultyState): boolean {
  return item.n >= ITEM_CONFIDENT_N;
}
