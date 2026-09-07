import { describe, it, expect } from 'vitest';
import { wilsonLowerBound, MASTERY_MIN_ATTEMPTS_FOR_LABEL } from './mastery-confidence';

// This file mirrors src/lib/__tests__/mastery-confidence.test.ts's coverage
// of wilsonLowerBound closely enough to catch the two copies drifting —
// the backend is the source of truth; this is the manual-sync client copy
// (see the file header) that only exists for the top "Accuracy" stat tile.
describe('wilsonLowerBound (frontend mirror)', () => {
  it('returns 0 for zero trials', () => {
    expect(wilsonLowerBound(0, 0)).toBe(0);
  });

  it('discounts a single 100%-accurate attempt well below the raw ratio', () => {
    const bound = wilsonLowerBound(1, 1);
    expect(bound).toBeGreaterThan(0.15);
    expect(bound).toBeLessThan(0.3);
  });

  it('converges toward the raw ratio as trials grow', () => {
    expect(wilsonLowerBound(100, 100)).toBeGreaterThan(wilsonLowerBound(1, 1));
    expect(wilsonLowerBound(100, 100)).toBeGreaterThan(0.9);
  });

  it('never exceeds the raw ratio', () => {
    expect(wilsonLowerBound(3, 4)).toBeLessThanOrEqual(0.75);
  });

  it('mirrors the backend constant value for the min-attempts label gate', () => {
    expect(MASTERY_MIN_ATTEMPTS_FOR_LABEL).toBe(5);
  });
});
