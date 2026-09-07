import { describe, it, expect } from 'vitest';
import {
  wilsonLowerBound,
  topicMasteryDisplay,
  MASTERY_MIN_ATTEMPTS_FOR_LABEL,
  MASTERY_HIGH_CONFIDENCE_ATTEMPTS,
} from '../mastery-confidence';

describe('wilsonLowerBound', () => {
  it('returns 0 for zero trials — no data, no confidence', () => {
    expect(wilsonLowerBound(0, 0)).toBe(0);
  });

  it('the exact bug this fix closes: 1/1 correct no longer reads as a confident 100%', () => {
    const bound = wilsonLowerBound(1, 1);
    expect(bound).toBeGreaterThan(0.15);
    expect(bound).toBeLessThan(0.3);
  });

  it('is monotonically closer to the raw ratio as trials grow, for a fixed 100% success rate', () => {
    const n1 = wilsonLowerBound(1, 1);
    const n5 = wilsonLowerBound(5, 5);
    const n15 = wilsonLowerBound(15, 15);
    const n100 = wilsonLowerBound(100, 100);
    expect(n1).toBeLessThan(n5);
    expect(n5).toBeLessThan(n15);
    expect(n15).toBeLessThan(n100);
    expect(n100).toBeGreaterThan(0.9);
    expect(n100).toBeLessThan(1);
  });

  it('never exceeds the raw ratio (it is a LOWER bound)', () => {
    for (const [s, t] of [[1, 1], [3, 5], [7, 10], [40, 50]] as const) {
      expect(wilsonLowerBound(s, t)).toBeLessThanOrEqual(s / t + 1e-9);
    }
  });

  it('stays within [0, 1] for every successes/trials combination, including 0 successes', () => {
    for (const [s, t] of [[0, 1], [0, 10], [1, 10], [10, 10]] as const) {
      const b = wilsonLowerBound(s, t);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(1);
    }
  });

  it('0 successes out of many trials is a confident near-zero, not just zero', () => {
    expect(wilsonLowerBound(0, 50)).toBeLessThan(0.1);
  });

  it('respects a custom z-score (a wider interval for a higher confidence level)', () => {
    const z95 = wilsonLowerBound(3, 5);
    const z99 = wilsonLowerBound(3, 5, 2.576);
    expect(z99).toBeLessThan(z95); // higher confidence -> wider interval -> lower lower-bound
  });
});

describe('topicMasteryDisplay', () => {
  it('flags zero attempts as confidence "none" with a 0% display', () => {
    const d = topicMasteryDisplay(0, 0);
    expect(d.confidence).toBe('none');
    expect(d.displayPct).toBe(0);
    expect(d.hasEnoughDataForLabel).toBe(false);
  });

  it('flags a single attempt as "low" confidence even at 100% raw accuracy', () => {
    const d = topicMasteryDisplay(1, 1);
    expect(d.rawPct).toBe(100);
    expect(d.displayPct).toBeLessThan(30);
    expect(d.confidence).toBe('low');
    expect(d.hasEnoughDataForLabel).toBe(false);
  });

  it('crosses into "medium" confidence exactly at MASTERY_MIN_ATTEMPTS_FOR_LABEL', () => {
    const below = topicMasteryDisplay(MASTERY_MIN_ATTEMPTS_FOR_LABEL - 1, MASTERY_MIN_ATTEMPTS_FOR_LABEL - 1);
    const at = topicMasteryDisplay(MASTERY_MIN_ATTEMPTS_FOR_LABEL, MASTERY_MIN_ATTEMPTS_FOR_LABEL);
    expect(below.confidence).toBe('low');
    expect(below.hasEnoughDataForLabel).toBe(false);
    expect(at.confidence).toBe('medium');
    expect(at.hasEnoughDataForLabel).toBe(true);
  });

  it('crosses into "high" confidence exactly at MASTERY_HIGH_CONFIDENCE_ATTEMPTS', () => {
    const below = topicMasteryDisplay(MASTERY_HIGH_CONFIDENCE_ATTEMPTS - 1, MASTERY_HIGH_CONFIDENCE_ATTEMPTS - 1);
    const at = topicMasteryDisplay(MASTERY_HIGH_CONFIDENCE_ATTEMPTS, MASTERY_HIGH_CONFIDENCE_ATTEMPTS);
    expect(below.confidence).toBe('medium');
    expect(at.confidence).toBe('high');
  });

  it('keeps rawPct as the naive ratio for callers that need it', () => {
    const d = topicMasteryDisplay(3, 4);
    expect(d.rawPct).toBe(75);
    expect(d.displayPct).toBeLessThan(75);
  });
});
