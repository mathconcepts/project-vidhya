import { describe, it, expect } from 'vitest';
import { xpForAttempt, meetsQuizThreshold, QUIZ_XP_THRESHOLD_MINUTES, QUIZ_LENGTH, QUIZ_SECONDS_PER_ITEM } from '../xp';

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

/**
 * Copy-drift pin: frontend/src/pages/app/CheckpointQuizPage.tsx's
 * pre-quiz framing hardcodes "6 questions · about 8 minutes" as fixed,
 * intentionally-static design copy (DR-3 wireframe) — it does NOT read
 * these constants at render time. If either constant here ever changes,
 * that copy silently goes stale and lies to the student. This test is
 * the tripwire: it fails the moment QUIZ_LENGTH or QUIZ_SECONDS_PER_ITEM
 * drift from the values the frontend copy was written against, so a
 * change forces a conscious look at (and manual update of) that string
 * rather than a silent mismatch.
 */
describe('checkpoint quiz copy-drift pin (CheckpointQuizPage: "6 questions · about 8 minutes")', () => {
  it('QUIZ_LENGTH is 6 — the number CheckpointQuizPage prints as "6 questions"', () => {
    expect(QUIZ_LENGTH).toBe(6);
  });

  it('QUIZ_SECONDS_PER_ITEM budgets a 6-item quiz at exactly "about 8 minutes"', () => {
    expect(QUIZ_SECONDS_PER_ITEM).toBe(80);
    expect((QUIZ_LENGTH * QUIZ_SECONDS_PER_ITEM) / 60).toBe(8);
  });
});
