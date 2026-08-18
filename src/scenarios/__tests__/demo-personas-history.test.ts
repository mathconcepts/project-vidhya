/**
 * src/scenarios/__tests__/demo-personas-history.test.ts — T20 (D9, OV2-2).
 *
 * Locks the §11 T20 addendum's data-level guarantees by running the REAL
 * Elo/FSRS/XP/deterministic-scorer math (via demo-history-plan.ts's pure
 * `simulate()`) against the real committed LA catalog
 * (data/practice-items/*.json, through FileLearningObjectCatalog — no
 * database). If a future change to Elo/FSRS defaults, xpForAttempt's
 * scaling, or the practice-item bank silently breaks what the tuned
 * attempt counts in demo-personas-history.ts were relying on, THIS test
 * fails — not a live demo walkthrough discovering it.
 */

import { describe, it, expect } from 'vitest';
import { FileLearningObjectCatalog } from '../../scoring/learning-object-catalog-file';
import { buildAttempts, simulate } from '../demo-history-plan';
import {
  MEERA_MASTERED_CLUSTER_A, MEERA_MASTERED_CLUSTER_B, MEERA_WEAK, MEERA_PLACED,
  MEERA_TOUCHED_CONCEPTS, MEERA_XP_WINDOW_DAYS, meeraHistoryGroups,
  RAHUL_TOUCHED_CONCEPTS, RAHUL_XP_WINDOW_DAYS, rahulHistoryGroups,
} from '../demo-personas-history';
import { QUIZ_LENGTH, QUIZ_POOL_MULTIPLE, QUIZ_XP_THRESHOLD_MINUTES } from '../../scoring/xp';
import { FRONTIER_ITEMS_PER_CONCEPT } from '../../api/quiz-routes';

const NOW = new Date('2026-08-18T09:00:00.000Z');
const QUIZ_POOL_GATE = QUIZ_POOL_MULTIPLE * QUIZ_LENGTH;

// The full 26-concept LA set (mirrors data/curriculum/gate-ma.yml's LA subgraph).
const ALL_LA_CONCEPTS = [
  'matrix-operations', 'determinants', 'matrix-inverse', 'systems-of-equations',
  'rank-nullity', 'vector-spaces', 'linear-transformations', 'eigenvalues',
  'diagonalization', 'cayley-hamilton', 'orthogonality', 'trace',
  'linear-independence', 'null-space-column-space', 'symmetric-matrices',
  'inner-product-spaces', 'gram-schmidt', 'change-of-basis', 'lu-factorization',
  'least-squares', 'quadratic-forms', 'positive-definite-matrices',
  'spectral-theorem', 'svd', 'jordan-normal-form', 'matrix-norms',
];

async function runSim(personaId: string, groups: ReturnType<typeof meeraHistoryGroups>, xpWindowDays: number) {
  const catalog = new FileLearningObjectCatalog();
  const itemCache = new Map<string, string | null>();
  async function itemIdForConcept(conceptId: string): Promise<string | null> {
    if (!itemCache.has(conceptId)) {
      const rows = await catalog.query({ skillId: conceptId, limit: 1 });
      itemCache.set(conceptId, rows[0]?.id ?? null);
    }
    return itemCache.get(conceptId)!;
  }
  const idMap = new Map<string, string | null>();
  for (const g of groups) idMap.set(g.conceptId, await itemIdForConcept(g.conceptId));
  const attempts = buildAttempts(personaId, groups, NOW, (c) => idMap.get(c) ?? null);
  return simulate(personaId, attempts, NOW, (id) => catalog.getById(id), { xpWindowDays });
}

describe('Meera (meera-gate-la-anxious) seeded history', () => {
  it('every concept in BOTH mastered clusters reaches genuine Elo mastery', async () => {
    const sim = await runSim('meera-gate-la-anxious', meeraHistoryGroups(), MEERA_XP_WINDOW_DAYS);
    for (const c of [...MEERA_MASTERED_CLUSTER_A, ...MEERA_MASTERED_CLUSTER_B]) {
      expect(sim.concepts[c]?.masteryState, `${c} should be mastered`).toBe('mastered');
    }
  });

  it('her real persona-declared weak concepts stay genuinely NOT mastered', async () => {
    const sim = await runSim('meera-gate-la-anxious', meeraHistoryGroups(), MEERA_XP_WINDOW_DAYS);
    for (const c of MEERA_WEAK) {
      expect(sim.concepts[c]?.masteryState, `${c} must not be mastered`).not.toBe('mastered');
    }
  });

  it('single-exposure concepts land in the "placed" (learning, n=1) state', async () => {
    const sim = await runSim('meera-gate-la-anxious', meeraHistoryGroups(), MEERA_XP_WINDOW_DAYS);
    for (const c of MEERA_PLACED) {
      expect(sim.concepts[c]?.n).toBe(1);
      expect(sim.concepts[c]?.masteryState).toBe('learning');
    }
  });

  it('has at least one due-for-review concept with reps > 0', async () => {
    const sim = await runSim('meera-gate-la-anxious', meeraHistoryGroups(), MEERA_XP_WINDOW_DAYS);
    expect(sim.dueConceptIds.length).toBeGreaterThanOrEqual(1);
    for (const c of sim.dueConceptIds) {
      expect(sim.concepts[c]?.n).toBeGreaterThan(0);
    }
  });

  it('later concepts (never in any group) stay genuinely untouched', async () => {
    const sim = await runSim('meera-gate-la-anxious', meeraHistoryGroups(), MEERA_XP_WINDOW_DAYS);
    const untouched = ALL_LA_CONCEPTS.filter((c) => !MEERA_TOUCHED_CONCEPTS.includes(c as any));
    expect(untouched.length).toBeGreaterThan(0); // sanity: the fixture isn't vacuous
    for (const c of untouched) {
      expect(sim.concepts[c], `${c} must have no attempts`).toBeUndefined();
    }
    expect(Object.keys(sim.concepts).sort()).toEqual([...MEERA_TOUCHED_CONCEPTS].sort());
  });

  it('the XP meter reads mid-scale — not empty, not at/past the quiz threshold', async () => {
    const sim = await runSim('meera-gate-la-anxious', meeraHistoryGroups(), MEERA_XP_WINDOW_DAYS);
    expect(sim.totalXpMinutes).toBeGreaterThan(20);
    expect(sim.totalXpMinutes).toBeLessThan(QUIZ_XP_THRESHOLD_MINUTES);
  });

  it('is quiz-ready: touched-concept count structurally clears the 2x pool gate', () => {
    // Upper bound on frontier contribution alone (ignores due-rows and
    // no-repeat exclusions, which can only shrink the real pool) —
    // touching MORE concepts than this can only help, never hurt.
    const maxPossibleFrontier = MEERA_TOUCHED_CONCEPTS.length * FRONTIER_ITEMS_PER_CONCEPT;
    expect(maxPossibleFrontier).toBeGreaterThanOrEqual(QUIZ_POOL_GATE);
  });

  it('the plan is deterministic — re-running produces byte-identical attempt sequences', async () => {
    const a = buildAttempts('meera-gate-la-anxious', meeraHistoryGroups(), NOW, () => 'x');
    const b = buildAttempts('meera-gate-la-anxious', meeraHistoryGroups(), NOW, () => 'x');
    expect(a).toEqual(b);
  });
});

describe('Rahul (rahul-gate-rank-push) — honest empty state', () => {
  it('touches few enough concepts that the quiz pool cannot structurally clear the 2x gate', () => {
    const maxPossibleFrontier = RAHUL_TOUCHED_CONCEPTS.length * FRONTIER_ITEMS_PER_CONCEPT;
    expect(maxPossibleFrontier).toBeLessThan(QUIZ_POOL_GATE);
  });

  it('still produces real, gradeable attempt history (not simply absent)', async () => {
    const sim = await runSim('rahul-gate-rank-push', rahulHistoryGroups(), RAHUL_XP_WINDOW_DAYS);
    for (const c of RAHUL_TOUCHED_CONCEPTS) {
      expect(sim.concepts[c]?.n).toBeGreaterThan(0);
    }
  });

  it('is deterministic', async () => {
    const a = await runSim('rahul-gate-rank-push', rahulHistoryGroups(), RAHUL_XP_WINDOW_DAYS);
    const b = await runSim('rahul-gate-rank-push', rahulHistoryGroups(), RAHUL_XP_WINDOW_DAYS);
    expect(a.totalXpMinutes).toBe(b.totalXpMinutes);
    expect(a.dueConceptIds.sort()).toEqual(b.dueConceptIds.sort());
  });
});
