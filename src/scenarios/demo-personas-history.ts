/**
 * src/scenarios/demo-personas-history.ts — T20 (D9, OV2-2): the concrete,
 * TUNED concept-group specs for the two demo personas whose multi-day
 * history makes the B-layer mechanisms (FIRe scheduling, due-review
 * compression, the frontier view, and an unlockable checkpoint quiz)
 * visible on demo day, per the §11 T20 addendum.
 *
 * These numbers were tuned empirically against the REAL Elo/FSRS/XP math
 * (src/scenarios/demo-history-plan.ts's `simulate()`, run standalone —
 * no database needed) until the resulting simulation satisfied every
 * addendum requirement; src/scenarios/__tests__/demo-personas-history.test.ts
 * locks the exact assertions so a future change to Elo/FSRS defaults or
 * xpForAttempt's scaling that silently breaks these guarantees fails CI
 * instead of quietly going stale before the next demo.
 *
 *   Meera (meera-gate-la-anxious) — the primary walkthrough persona:
 *     - 7 concepts pushed to genuine Elo-mastered (≥2 clusters' worth —
 *       see MEERA_MASTERED_CLUSTER_A / _B below)
 *     - her real persona weak concepts (data/personas/meera-gate-la-
 *       anxious.yaml: eigenvalues, determinants, linear-transformations,
 *       orthogonality) stay well below mastered, genuinely weak
 *     - 3 concepts touched exactly once — the "placed" (single-exposure)
 *       contrast against the mastered/weak "demonstrated" states
 *     - several due-for-review concepts (reps>0, due_at in the past) —
 *       the retain-arm / FIRe knock-out material
 *     - 15 of 26 LA concepts touched total; the remaining 11 stay
 *       genuinely untouched — the frontier's dimmed "later" rows
 *     - a bounded RECENT practice window (last 5 days) is the ONLY
 *       source of displayed XP — see demo-history-plan.ts's `simulate()`
 *       doc for why mastery-building history and the visible meter are
 *       deliberately decoupled here — landing the total at Meera = quiz-
 *       READY on pool depth (15 touched concepts far exceeds the 2×
 *       quiz-length gate) while her XP METER still reads mid-scale, not
 *       maxed — so the live 3-minute demo can visibly cross the
 *       threshold with a couple more practice attempts.
 *
 *   Rahul (rahul-gate-rank-push) — the counterweight persona: touches
 *     only 3 concepts, deliberately keeping the quiz pool BELOW the 2×
 *     gate — OV2-8/the T20 addendum's explicit "one persona shows the
 *     honest empty state" requirement. Max possible frontier
 *     contribution is `touchedConcepts * FRONTIER_ITEMS_PER_CONCEPT` =
 *     3 * 3 = 9, structurally under the 12-item (2×6) gate regardless of
 *     no-repeat exclusions — see the exported constant import below.
 */

import type { ConceptGroupSpec } from './demo-history-plan';

// ────────────────────────────────────────────────────────────────────
// Meera — meera-gate-la-anxious
// ────────────────────────────────────────────────────────────────────

/** Cluster A: the earliest LA spine (matrix mechanics). */
export const MEERA_MASTERED_CLUSTER_A = [
  'matrix-operations', 'matrix-inverse', 'trace', 'vector-spaces',
] as const;

/** Cluster B: the next depth (systems + independence). */
export const MEERA_MASTERED_CLUSTER_B = [
  'rank-nullity', 'null-space-column-space', 'systems-of-equations',
] as const;

export const MEERA_MASTERED = [...MEERA_MASTERED_CLUSTER_A, ...MEERA_MASTERED_CLUSTER_B] as const;

/** Meera's real persona-declared weak concepts (data/personas/meera-gate-la-anxious.yaml). */
export const MEERA_WEAK = ['eigenvalues', 'determinants', 'linear-transformations', 'orthogonality'] as const;

/** Single-exposure — the "placed" (not yet demonstrated) contrast. */
export const MEERA_PLACED = ['symmetric-matrices', 'inner-product-spaces', 'gram-schmidt'] as const;

/** A concept given only far-past attempts — mastery without recent freshness. */
export const MEERA_DUE_ONLY = ['linear-independence'] as const;

export const MEERA_TOUCHED_CONCEPTS = [
  ...MEERA_MASTERED, ...MEERA_DUE_ONLY, ...MEERA_WEAK, ...MEERA_PLACED,
] as const;

/** How far back XP stops counting toward the displayed meter (see module doc). */
export const MEERA_XP_WINDOW_DAYS = 5;

export function meeraHistoryGroups(): ConceptGroupSpec[] {
  return [
    // Old, mastery-building — OUTSIDE the XP window (Elo/FSRS apply; XP doesn't).
    ...MEERA_MASTERED.map((conceptId) => ({
      conceptId, numAttempts: 36, probCorrect: 0.95, minDaysAgo: 8, maxDaysAgo: 45,
    })),
    ...MEERA_DUE_ONLY.map((conceptId) => ({
      conceptId, numAttempts: 3, probCorrect: 0.9, minDaysAgo: 20, maxDaysAgo: 30,
    })),
    ...MEERA_WEAK.map((conceptId) => ({
      conceptId, numAttempts: 4, probCorrect: 0.2, minDaysAgo: 6, maxDaysAgo: 12,
    })),
    ...MEERA_PLACED.map((conceptId) => ({
      conceptId, numAttempts: 1, probCorrect: 0.5, minDaysAgo: 6, maxDaysAgo: 9,
    })),
    // Recent — WITHIN the XP window; this is what the meter shows.
    ...MEERA_MASTERED.map((conceptId) => ({
      conceptId, numAttempts: 3, probCorrect: 0.95, minDaysAgo: 1, maxDaysAgo: 4,
    })),
  ];
}

// ────────────────────────────────────────────────────────────────────
// Rahul — rahul-gate-rank-push (the honest-empty-state counterweight)
// ────────────────────────────────────────────────────────────────────

export const RAHUL_TOUCHED_CONCEPTS = ['eigenvalues', 'determinants', 'linear-transformations'] as const;

export function rahulHistoryGroups(): ConceptGroupSpec[] {
  return RAHUL_TOUCHED_CONCEPTS.map((conceptId) => ({
    conceptId, numAttempts: 2, probCorrect: 0.85, minDaysAgo: 1, maxDaysAgo: 3,
  }));
}

export const RAHUL_XP_WINDOW_DAYS = 5;
