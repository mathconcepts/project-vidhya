/**
 * Unit tests for the dual-metric lift helpers — twoProportionPValue and
 * computeAccuracy. The DB path of computePyqAccuracyDelta is integration-
 * tested via docker-compose smoke; this file pins the math.
 */

import { describe, it, expect } from 'vitest';
import { __testing } from '../lift';

const { twoProportionPValue, computeAccuracy } = __testing;

describe('twoProportionPValue', () => {
  it('returns 1 when either sample is empty', () => {
    expect(twoProportionPValue(0, 0, 5, 10)).toBe(1);
    expect(twoProportionPValue(5, 10, 0, 0)).toBe(1);
  });

  it('returns ~1 when both proportions are equal', () => {
    expect(twoProportionPValue(50, 100, 50, 100)).toBeCloseTo(1, 3);
  });

  it('returns small p for clearly different proportions', () => {
    // 80/100 vs 30/100 — large effect size
    const p = twoProportionPValue(80, 100, 30, 100);
    expect(p).toBeLessThan(0.001);
  });

  it('returns moderate p for small effect at small n', () => {
    const p = twoProportionPValue(6, 10, 5, 10);
    // Small sample, small effect: p should be > 0.5
    expect(p).toBeGreaterThan(0.5);
  });

  it('handles boundary case where pPool=0 (everyone wrong)', () => {
    const p = twoProportionPValue(0, 100, 0, 100);
    // Both 0/100 → equal → p = 1
    expect(p).toBe(1);
  });

  it('handles boundary case where pPool=1 (everyone right)', () => {
    const p = twoProportionPValue(100, 100, 100, 100);
    expect(p).toBe(1);
  });
});

describe('computeAccuracy', () => {
  it('returns rate=0 for empty input', () => {
    expect(computeAccuracy([])).toEqual({ correct: 0, total: 0, rate: 0 });
  });

  it('counts correct and total accurately', () => {
    const r = computeAccuracy([
      { problem_id: 'p1', is_correct: true },
      { problem_id: 'p2', is_correct: false },
      { problem_id: 'p3', is_correct: true },
    ]);
    expect(r).toEqual({ correct: 2, total: 3, rate: 2 / 3 });
  });

  it('handles all-correct cohort', () => {
    const r = computeAccuracy([
      { problem_id: 'p1', is_correct: true },
      { problem_id: 'p2', is_correct: true },
    ]);
    expect(r.rate).toBe(1);
  });

  it('handles all-wrong cohort', () => {
    const r = computeAccuracy([
      { problem_id: 'p1', is_correct: false },
      { problem_id: 'p2', is_correct: false },
    ]);
    expect(r.rate).toBe(0);
  });
});
