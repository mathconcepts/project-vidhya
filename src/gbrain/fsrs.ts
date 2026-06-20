/**
 * src/gbrain/fsrs.ts — FSRS-style spaced repetition.
 *
 * Phase 1 of the 100x Blueprint (§3.4, D3). Replaces the SM-2
 * retention-scheduler with a Difficulty / Stability / Retrievability
 * (DSR) memory model that schedules reviews by predicted recall
 * probability — the same mathematical family Anki shipped in 2024.
 *
 * Why FSRS over SM-2 (§3.4):
 *   - 20–30% fewer reviews at equal retention (open benchmark)
 *   - Predicts P(recall) at any time, not just "next due date"
 *   - Per-card state means honest-different memory tracks per concept
 *
 * Why a small port rather than the upstream npm package: the upstream
 * ts-fsrs package is excellent but pulls a bunch of card-state plumbing
 * we don't need. The DSR core is ~30 lines. Caller persistence keeps
 * tests pure-function fast.
 *
 * Reference formulas: open-spaced-repetition.github.io/fsrs/
 *
 * Calibration: per-user parameters can be re-fit once a user has ~few
 * hundred reviews (Phase 4). For Phase 1 we ship published defaults.
 */

// ────────────────────────────────────────────────────────────────────
// Defaults — FSRS-6 weights as published. Locked here so prod can't
// silently drift. Per-user re-fit happens behind a flag in Phase 4.
// ────────────────────────────────────────────────────────────────────

/** w[0..16]: initial stability per rating + difficulty params. */
export const FSRS6_DEFAULT_W = [
  0.4072, 1.1829, 3.1262, 15.4722,
  7.2102, 0.5316, 1.0651, 0.0234,
  1.616, 0.1544, 1.0824, 1.9813,
  0.0953, 0.2975, 2.2042, 0.2407,
  2.9466,
] as const;

/** Decay constant; controls how retrievability falls off with time. */
export const FSRS_DECAY = -0.5;

/** Factor in the retrievability formula. */
export const FSRS_FACTOR = Math.pow(0.9, 1 / FSRS_DECAY) - 1;

/** Default target retention. Student-tunable later. */
export const FSRS_DEFAULT_TARGET = 0.9;

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

export type Rating = 1 | 2 | 3 | 4;   // again / hard / good / easy

export interface FsrsCard {
  /** Time stability in days; bigger = memory lasts longer. */
  stability: number;
  /** Item difficulty 1..10 (the FSRS scalar, not Elo). */
  difficulty: number;
  /** ISO timestamp of the last review. */
  lastReviewAt: string;
  /** Number of reviews so far. */
  reps: number;
  /** Number of lapses (Again ratings). */
  lapses: number;
  /** When this card is next due (ISO). */
  dueAt: string;
}

// ────────────────────────────────────────────────────────────────────
// Core math
// ────────────────────────────────────────────────────────────────────

/**
 * Probability the student still recalls this card after `elapsedDays`,
 * given its current stability. Exponential-power decay.
 */
export function retrievability(stability: number, elapsedDays: number): number {
  if (stability <= 0 || elapsedDays <= 0) return 1;
  return Math.pow(1 + (FSRS_FACTOR * elapsedDays) / stability, FSRS_DECAY);
}

/**
 * Days until retrievability falls to the target. Inverts retrievability().
 */
export function intervalForRetention(stability: number, target = FSRS_DEFAULT_TARGET): number {
  if (stability <= 0) return 1;
  return (stability / FSRS_FACTOR) * (Math.pow(target, 1 / FSRS_DECAY) - 1);
}

function clampDifficulty(d: number): number {
  return Math.min(10, Math.max(1, d));
}

/**
 * Update difficulty given a rating. Higher ratings ease the card; Again
 * makes it harder. Linear damped move.
 */
function nextDifficulty(d: number, rating: Rating, w = FSRS6_DEFAULT_W): number {
  const deltaD = -w[6] * (rating - 3);
  const next = d + deltaD * (10 - d) / 9;
  return clampDifficulty(w[7] * w[4] + (1 - w[7]) * next);
}

/**
 * Initial stability after the very first review, by rating.
 */
function initialStability(rating: Rating, w = FSRS6_DEFAULT_W): number {
  return Math.max(0.1, w[rating - 1]);
}

/**
 * Initial difficulty after the very first review.
 */
function initialDifficulty(rating: Rating, w = FSRS6_DEFAULT_W): number {
  return clampDifficulty(w[4] - Math.exp(w[5] * (rating - 1)) + 1);
}

/**
 * Stability after a successful review (rating ≥ 2).
 */
function nextStabilityOnSuccess(
  stability: number,
  difficulty: number,
  retrievabilityAtReview: number,
  rating: Rating,
  w = FSRS6_DEFAULT_W
): number {
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  const stabIncrease =
    Math.exp(w[8]) *
    (11 - difficulty) *
    Math.pow(stability, -w[9]) *
    (Math.exp((1 - retrievabilityAtReview) * w[10]) - 1) *
    hardPenalty *
    easyBonus;
  return Math.max(0.1, stability * (1 + stabIncrease));
}

/**
 * Stability after a lapse (rating = 1).
 */
function nextStabilityOnLapse(
  stability: number,
  difficulty: number,
  retrievabilityAtReview: number,
  w = FSRS6_DEFAULT_W
): number {
  const s =
    w[11] *
    Math.pow(difficulty, -w[12]) *
    (Math.pow(stability + 1, w[13]) - 1) *
    Math.exp((1 - retrievabilityAtReview) * w[14]);
  return Math.max(0.1, Math.min(stability, s));
}

// ────────────────────────────────────────────────────────────────────
// Public API — pure functions, caller persists.
// ────────────────────────────────────────────────────────────────────

/**
 * Create a brand-new FSRS card from the first review.
 */
export function initCard(
  rating: Rating,
  now: Date = new Date(),
  target = FSRS_DEFAULT_TARGET
): FsrsCard {
  const stability = initialStability(rating);
  const difficulty = initialDifficulty(rating);
  const intervalDays = Math.max(1, Math.round(intervalForRetention(stability, target)));
  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + intervalDays);
  return {
    stability,
    difficulty,
    lastReviewAt: now.toISOString(),
    reps: 1,
    lapses: rating === 1 ? 1 : 0,
    dueAt: dueAt.toISOString(),
  };
}

/**
 * Apply a review to an existing card. Returns the new card state and
 * the days until the next review.
 */
export function reviewCard(
  card: FsrsCard,
  rating: Rating,
  now: Date = new Date(),
  target = FSRS_DEFAULT_TARGET
): { card: FsrsCard; intervalDays: number } {
  const last = new Date(card.lastReviewAt);
  const elapsedDays = Math.max(0, (now.getTime() - last.getTime()) / 86_400_000);
  const r = retrievability(card.stability, elapsedDays);

  const newDifficulty = nextDifficulty(card.difficulty, rating);
  const newStability = rating === 1
    ? nextStabilityOnLapse(card.stability, card.difficulty, r)
    : nextStabilityOnSuccess(card.stability, card.difficulty, r, rating);

  const intervalDays = Math.max(1, Math.round(intervalForRetention(newStability, target)));
  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + intervalDays);

  return {
    card: {
      stability: newStability,
      difficulty: newDifficulty,
      lastReviewAt: now.toISOString(),
      reps: card.reps + 1,
      lapses: card.lapses + (rating === 1 ? 1 : 0),
      dueAt: dueAt.toISOString(),
    },
    intervalDays,
  };
}

/**
 * Probability the student would recall this card right now. Used by
 * the Readiness Engine to decide whether a Retain action is worth the
 * minutes vs an Acquire action.
 */
export function recallProbability(card: FsrsCard, now: Date = new Date()): number {
  const last = new Date(card.lastReviewAt);
  const elapsedDays = Math.max(0, (now.getTime() - last.getTime()) / 86_400_000);
  return retrievability(card.stability, elapsedDays);
}

/**
 * Map a binary correct/incorrect outcome to an FSRS rating. SM-2 used
 * a 0..5 quality; FSRS uses 1..4. The blueprint deliberately keeps the
 * mapping simple: time-aware "good" vs "hard" vs "easy"; any incorrect
 * is Again. Callers with richer signals (hint used, multiple tries)
 * should set rating directly.
 */
export function ratingFromAttempt(
  correct: boolean,
  timeSeconds: number | undefined
): Rating {
  if (!correct) return 1;
  const t = timeSeconds ?? 30;
  if (t < 10) return 4;
  if (t < 45) return 3;
  return 2;
}
