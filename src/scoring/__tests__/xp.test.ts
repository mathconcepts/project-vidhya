import { describe, it, expect } from 'vitest';
import { xpForAttempt, meetsQuizThreshold, QUIZ_XP_THRESHOLD_MINUTES } from '../xp';

describe('xpForAttempt', () => {
  it('awards close to the full estMinutes on a fully-correct attempt', () => {
    expect(xpForAttempt({ earned: 2, max: 2 }, 3)).toBe(3);
  });

  it('scales down for partial credit', () => {
    expect(xpForAttempt({ earned: 1, max: 2 }, 4)).toBe(2);
  });

  it('is negative for a wrong MCQ under negative marking (earned < 0)', () => {
    expect(xpForAttempt({ earned: -2 / 3, max: 2 }, 3)).toBeLessThan(0);
  });

  it('is zero for a wrong MSQ/NAT (earned 0, never negative for those kinds)', () => {
    expect(xpForAttempt({ earned: 0, max: 2 }, 3)).toBe(0);
  });

  it('never divides by zero — a malformed item (max<=0) earns 0', () => {
    expect(xpForAttempt({ earned: 0, max: 0 }, 3)).toBe(0);
  });

  it('never awards XP for an item with no time estimate', () => {
    expect(xpForAttempt({ earned: 2, max: 2 }, 0)).toBe(0);
  });
});

describe('meetsQuizThreshold', () => {
  it('is false below the threshold', () => {
    expect(meetsQuizThreshold(64)).toBe(false);
  });

  it('is true at or above the threshold', () => {
    expect(meetsQuizThreshold(QUIZ_XP_THRESHOLD_MINUTES)).toBe(true);
    expect(meetsQuizThreshold(150)).toBe(true);
  });

  it('honours a custom threshold', () => {
    expect(meetsQuizThreshold(50, 50)).toBe(true);
    expect(meetsQuizThreshold(49, 50)).toBe(false);
  });
});
