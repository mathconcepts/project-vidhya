/**
 * src/readiness/diagnostic-warmup.ts — cold-start dignity for new students.
 *
 * Wave 4 of the 100x. The blueprint anchors a new student at Elo 1500
 * (an average JEE candidate), which is wildly wrong for a true beginner
 * (Class 8 trying to bridge to JEE) AND wrong for a strong student
 * (already practising at IIT level). Both ends suffer 6-8 demoralising
 * mismatches before the K=32 update catches up.
 *
 * The warm-up is a binary-search-style diagnostic: pick a probe item,
 * widen or narrow the ability bracket based on the answer, and converge
 * on a calibrated rating in ~5-8 items. The student feels "the system
 * is figuring me out" rather than "I'm failing this app."
 *
 * Honest naming: this is approximate IRT cold-start, not a substitute
 * for the proper diagnostic that runs in a Phase-4 CAT engine. But it
 * removes the biggest UX failure mode at near-zero cost.
 *
 * Pure functions over a starting bracket + a sequence of attempts.
 * Caller persists the final ability into `student_skill_elo` once the
 * warm-up converges.
 */

import type { LearningObject, SkillId } from '../core/interfaces';
import { expectedSuccess } from '../gbrain/elo';
import type { LearningObjectCatalog } from '../scoring/learning-object-catalog';

// ────────────────────────────────────────────────────────────────────
// Tuneables
// ────────────────────────────────────────────────────────────────────

/** Default sweep — covers Class-8 beginner (~800) to strong-IIT (~2100). */
export const WARMUP_DIFFICULTY_FLOOR = 800;
export const WARMUP_DIFFICULTY_CEILING = 2100;

/** Stop warming up after this many probes, even if not converged. */
export const WARMUP_MAX_ITEMS = 8;

/**
 * Bracket width below which we declare convergence. 400 is intentionally
 * loose — Elo's K=32 closes the remaining gap in a few normal-practice
 * attempts, and a too-strict threshold strands students on sparse
 * catalogs (early-stage subjects with <30 items per skill).
 */
export const WARMUP_CONVERGED_WIDTH = 400;

/** Minimum probes before we'll declare convergence — avoids 2-item bail. */
export const WARMUP_MIN_ITEMS = 4;

// ────────────────────────────────────────────────────────────────────
// State + reducer
// ────────────────────────────────────────────────────────────────────

export interface WarmupState {
  skillId: SkillId;
  /** Lower bound on the student's ability — inclusive. */
  abilityLow: number;
  /** Upper bound on the student's ability — inclusive. */
  abilityHigh: number;
  /** Items the student has answered so far (object ids). */
  answeredIds: ReadonlyArray<string>;
  /** Per-probe outcomes for telemetry / debugging. */
  history: ReadonlyArray<{ objectId: string; difficulty: number; correct: boolean }>;
}

/** Fresh warm-up for a brand-new student in a skill. */
export function newWarmup(skillId: SkillId): WarmupState {
  return {
    skillId,
    abilityLow: WARMUP_DIFFICULTY_FLOOR,
    abilityHigh: WARMUP_DIFFICULTY_CEILING,
    answeredIds: [],
    history: [],
  };
}

/** True when we have enough signal to seed Elo from the warm-up. */
export function isConverged(state: WarmupState): boolean {
  if (state.history.length >= WARMUP_MAX_ITEMS) return true;
  if (state.history.length < WARMUP_MIN_ITEMS) return false;
  return (state.abilityHigh - state.abilityLow) <= WARMUP_CONVERGED_WIDTH;
}

/** Final ability estimate (centre of the converged bracket). */
export function finalAbility(state: WarmupState): number {
  return Math.round((state.abilityLow + state.abilityHigh) / 2);
}

/**
 * Apply a binary-search-ish update: a correct answer raises the floor
 * to halfway up; an incorrect answer lowers the ceiling to halfway
 * down. Crucially, we DON'T just bisect — we move toward the centre of
 * the bracket, which preserves more information when the student
 * surprises us early.
 */
export function applyWarmupOutcome(
  state: WarmupState,
  outcome: { objectId: string; difficulty: number; correct: boolean },
): WarmupState {
  const midpoint = (state.abilityLow + state.abilityHigh) / 2;
  let newLow = state.abilityLow;
  let newHigh = state.abilityHigh;
  if (outcome.correct) {
    // Student handled this difficulty — their ability is at least the
    // probe difficulty - confidence margin, but pull the floor up
    // toward where the probe was placed.
    newLow = Math.min(state.abilityHigh, Math.max(newLow, (newLow + outcome.difficulty) / 2));
  } else {
    newHigh = Math.max(state.abilityLow, Math.min(newHigh, (newHigh + outcome.difficulty) / 2));
  }
  // Defensive: never let bracket invert.
  if (newLow > newHigh) {
    const mid = (newLow + newHigh) / 2;
    newLow = mid - 1;
    newHigh = mid + 1;
  }
  return {
    ...state,
    abilityLow: newLow,
    abilityHigh: newHigh,
    answeredIds: [...state.answeredIds, outcome.objectId],
    history: [...state.history, outcome],
  };
}

// ────────────────────────────────────────────────────────────────────
// Probe selection
// ────────────────────────────────────────────────────────────────────

export interface PickProbeDeps {
  catalog: LearningObjectCatalog;
}

/**
 * Pick the next probe item — the one closest to the current bracket
 * centre, NOT already answered, that the catalog actually has. Returns
 * null if we've exhausted the bracket (rare; means the catalog can't
 * cover the difficulty range we want).
 */
export async function pickNextProbe(
  state: WarmupState,
  deps: PickProbeDeps,
): Promise<LearningObject | null> {
  const target = (state.abilityLow + state.abilityHigh) / 2;
  // Pull a window around the target. Wider window means we'll find
  // SOMETHING even when the catalog is sparse.
  const candidates = await deps.catalog.query({
    skillId: state.skillId,
    types: ['practice'],          // never use a worked example as a probe
    diffMin: Math.max(WARMUP_DIFFICULTY_FLOOR, target - 250),
    diffMax: Math.min(WARMUP_DIFFICULTY_CEILING, target + 250),
    limit: 25,
  });

  const unseen = candidates.filter(c => !state.answeredIds.includes(c.id));
  if (unseen.length === 0) return null;

  // Closest to target wins.
  unseen.sort((a, b) => Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target));
  return unseen[0];
}

// ────────────────────────────────────────────────────────────────────
// Telemetry-friendly summary
// ────────────────────────────────────────────────────────────────────

export interface WarmupReport {
  skillId: SkillId;
  probesUsed: number;
  converged: boolean;
  abilityEstimate: number;
  /** Witnessed predicted-success at the final estimate against the last probe. */
  predictedSuccessAtClose: number;
}

export function summarize(state: WarmupState): WarmupReport {
  const probes = state.history.length;
  const ability = finalAbility(state);
  const lastDifficulty = probes > 0 ? state.history[probes - 1].difficulty : ability;
  return {
    skillId: state.skillId,
    probesUsed: probes,
    converged: isConverged(state),
    abilityEstimate: ability,
    predictedSuccessAtClose: expectedSuccess(ability, lastDifficulty),
  };
}
