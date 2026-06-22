/**
 * Tests for src/readiness/diagnostic-warmup.ts — cold-start dignity.
 */

import { describe, it, expect } from 'vitest';
import {
  newWarmup,
  applyWarmupOutcome,
  isConverged,
  finalAbility,
  pickNextProbe,
  summarize,
  WARMUP_DIFFICULTY_FLOOR,
  WARMUP_DIFFICULTY_CEILING,
  WARMUP_MAX_ITEMS,
} from '../diagnostic-warmup';
import { InMemoryCatalog } from '../../scoring/learning-object-catalog';
import type { LearningObject } from '../../core/interfaces';

function probe(id: string, difficulty: number): LearningObject {
  return {
    id,
    nodeId: 'algebra',
    type: 'practice',
    difficulty,
    estMinutes: 3,
    prereqs: [],
    verification: 'cas_passed',
    payload: { skillId: 'algebra' },
  };
}

describe('newWarmup', () => {
  it('starts with the full bracket and no history', () => {
    const s = newWarmup('algebra');
    expect(s.abilityLow).toBe(WARMUP_DIFFICULTY_FLOOR);
    expect(s.abilityHigh).toBe(WARMUP_DIFFICULTY_CEILING);
    expect(s.history).toHaveLength(0);
    expect(isConverged(s)).toBe(false);
  });
});

describe('applyWarmupOutcome', () => {
  it('a correct answer raises the floor', () => {
    const s0 = newWarmup('algebra');
    const s1 = applyWarmupOutcome(s0, { objectId: 'p1', difficulty: 1500, correct: true });
    expect(s1.abilityLow).toBeGreaterThan(s0.abilityLow);
    expect(s1.abilityHigh).toBe(s0.abilityHigh);
  });

  it('an incorrect answer lowers the ceiling', () => {
    const s0 = newWarmup('algebra');
    const s1 = applyWarmupOutcome(s0, { objectId: 'p1', difficulty: 1500, correct: false });
    expect(s1.abilityHigh).toBeLessThan(s0.abilityHigh);
    expect(s1.abilityLow).toBe(s0.abilityLow);
  });

  it('appends to history', () => {
    const s0 = newWarmup('algebra');
    const s1 = applyWarmupOutcome(s0, { objectId: 'p1', difficulty: 1500, correct: true });
    expect(s1.history).toHaveLength(1);
    expect(s1.history[0]).toEqual({ objectId: 'p1', difficulty: 1500, correct: true });
    expect(s1.answeredIds).toEqual(['p1']);
  });

  it('a strong student converges to a high ability', () => {
    let s = newWarmup('algebra');
    // Gets 5 items right at increasingly hard difficulties.
    for (const d of [1500, 1700, 1850, 1950, 2000]) {
      s = applyWarmupOutcome(s, { objectId: `p_${d}`, difficulty: d, correct: true });
    }
    expect(finalAbility(s)).toBeGreaterThan(1700);
  });

  it('a struggling student converges to a low ability', () => {
    let s = newWarmup('algebra');
    for (const d of [1500, 1300, 1150, 1050, 1000]) {
      s = applyWarmupOutcome(s, { objectId: `p_${d}`, difficulty: d, correct: false });
    }
    expect(finalAbility(s)).toBeLessThan(1300);
  });

  it('never inverts the bracket on extreme inputs', () => {
    let s = newWarmup('algebra');
    // All wrong, even at the ceiling — should keep low < high.
    for (let i = 0; i < 8; i++) {
      s = applyWarmupOutcome(s, { objectId: `p${i}`, difficulty: 2000, correct: false });
    }
    expect(s.abilityLow).toBeLessThanOrEqual(s.abilityHigh);
  });
});

describe('isConverged / finalAbility', () => {
  it('does not converge before MIN_ITEMS', () => {
    let s = newWarmup('algebra');
    for (const r of [true, false]) {
      s = applyWarmupOutcome(s, { objectId: `p_${r}`, difficulty: 1500, correct: r });
    }
    expect(isConverged(s)).toBe(false);
  });

  it('always converges by MAX_ITEMS', () => {
    let s = newWarmup('algebra');
    // 8 alternating outcomes — bracket stays wide-ish but max items hits.
    for (let i = 0; i < WARMUP_MAX_ITEMS; i++) {
      s = applyWarmupOutcome(s, { objectId: `p${i}`, difficulty: 1500, correct: i % 2 === 0 });
    }
    expect(isConverged(s)).toBe(true);
  });

  it('finalAbility is the midpoint of the converged bracket', () => {
    const s = applyWarmupOutcome(newWarmup('algebra'), { objectId: 'p', difficulty: 1500, correct: true });
    const mid = Math.round((s.abilityLow + s.abilityHigh) / 2);
    expect(finalAbility(s)).toBe(mid);
  });
});

describe('pickNextProbe', () => {
  it('returns null when the catalog has no items in range', async () => {
    const r = await pickNextProbe(newWarmup('algebra'), {
      catalog: new InMemoryCatalog([]),
    });
    expect(r).toBeNull();
  });

  it('picks the item closest to the bracket centre', async () => {
    const s = newWarmup('algebra'); // centre = 1450 (between 800 and 2100)
    const r = await pickNextProbe(s, {
      catalog: new InMemoryCatalog([
        probe('a', 1500),
        probe('b', 1700),
        probe('c', 1300),
      ]),
    });
    // 1500 is closest to the centre of [800, 2100] = 1450
    expect(r?.id).toBe('a');
  });

  it('does not re-pick an already-answered item', async () => {
    const s = applyWarmupOutcome(newWarmup('algebra'), { objectId: 'seen', difficulty: 1500, correct: true });
    const r = await pickNextProbe(s, {
      catalog: new InMemoryCatalog([
        probe('seen', 1500),
        probe('fresh', 1600),
      ]),
    });
    expect(r?.id).toBe('fresh');
  });

  it('rejects non-practice types for probes (no worked_example shortcuts)', async () => {
    const wex: LearningObject = { ...probe('wex', 1500), type: 'worked_example' };
    const r = await pickNextProbe(newWarmup('algebra'), {
      catalog: new InMemoryCatalog([wex]),
    });
    expect(r).toBeNull();
  });
});

describe('summarize', () => {
  it('reports probesUsed and convergence', () => {
    let s = newWarmup('algebra');
    for (let i = 0; i < 5; i++) {
      s = applyWarmupOutcome(s, { objectId: `p${i}`, difficulty: 1500, correct: true });
    }
    const r = summarize(s);
    expect(r.probesUsed).toBe(5);
    expect(r.skillId).toBe('algebra');
    expect(r.predictedSuccessAtClose).toBeGreaterThan(0);
    expect(r.predictedSuccessAtClose).toBeLessThanOrEqual(1);
  });
});

describe('end-to-end warm-up loop', () => {
  it('converges a beginner in ~5 items', async () => {
    // A beginner who fails everything above 1100.
    const catalog = new InMemoryCatalog([
      probe('p_1450', 1450),
      probe('p_1100', 1100),
      probe('p_900', 900),
      probe('p_1050', 1050),
      probe('p_1200', 1200),
      probe('p_950', 950),
      probe('p_1000', 1000),
      probe('p_1300', 1300),
    ]);
    let s = newWarmup('algebra');
    let probes = 0;
    while (!isConverged(s) && probes < 10) {
      const next = await pickNextProbe(s, { catalog });
      if (!next) break;
      const correct = next.difficulty <= 1100;
      s = applyWarmupOutcome(s, { objectId: next.id, difficulty: next.difficulty, correct });
      probes += 1;
    }
    expect(isConverged(s)).toBe(true);
    expect(finalAbility(s)).toBeLessThan(1300);
    expect(probes).toBeLessThanOrEqual(8);
  });

  it('converges a strong student in ~5 items', async () => {
    const catalog = new InMemoryCatalog([
      probe('p_1450', 1450),
      probe('p_1800', 1800),
      probe('p_2000', 2000),
      probe('p_1900', 1900),
      probe('p_1700', 1700),
      probe('p_1750', 1750),
      probe('p_2100', 2100),
      probe('p_1650', 1650),
    ]);
    let s = newWarmup('algebra');
    let probes = 0;
    while (!isConverged(s) && probes < 10) {
      const next = await pickNextProbe(s, { catalog });
      if (!next) break;
      const correct = next.difficulty <= 1900;
      s = applyWarmupOutcome(s, { objectId: next.id, difficulty: next.difficulty, correct });
      probes += 1;
    }
    expect(isConverged(s)).toBe(true);
    expect(finalAbility(s)).toBeGreaterThan(1500);
    expect(probes).toBeLessThanOrEqual(8);
  });
});
