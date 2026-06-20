/**
 * Tests for src/gbrain/elo.ts — Elo rating math.
 * Pure functions; no DB / network.
 */

import { describe, it, expect } from 'vitest';
import {
  expectedSuccess,
  updateElo,
  confidenceFromN,
  newStudentAbility,
  newItemDifficulty,
  applyAttempt,
  toAbility,
  itemDifficultyTrustworthy,
  ELO_INITIAL,
  K_STUDENT,
  K_ITEM,
} from '../elo';

describe('expectedSuccess', () => {
  it('returns 0.5 when ability == difficulty', () => {
    expect(expectedSuccess(1500, 1500)).toBeCloseTo(0.5, 6);
  });

  it('returns ~0.91 at +400 rating delta (10:1 odds)', () => {
    expect(expectedSuccess(1900, 1500)).toBeCloseTo(10 / 11, 3);
  });

  it('is monotonic in ability', () => {
    expect(expectedSuccess(1600, 1500)).toBeGreaterThan(expectedSuccess(1500, 1500));
    expect(expectedSuccess(1400, 1500)).toBeLessThan(expectedSuccess(1500, 1500));
  });
});

describe('updateElo', () => {
  it('a correct answer moves student up and item down', () => {
    const r = updateElo({ studentRating: 1500, itemRating: 1500, correct: true });
    expect(r.newStudentRating).toBeGreaterThan(1500);
    expect(r.newItemRating).toBeLessThan(1500);
    expect(r.expected).toBeCloseTo(0.5);
  });

  it('an incorrect answer moves student down and item up', () => {
    const r = updateElo({ studentRating: 1500, itemRating: 1500, correct: false });
    expect(r.newStudentRating).toBeLessThan(1500);
    expect(r.newItemRating).toBeGreaterThan(1500);
  });

  it('zero-sum-ish: |student delta| / kS == |item delta| / kI', () => {
    const r = updateElo({ studentRating: 1500, itemRating: 1500, correct: true });
    const sDelta = (r.newStudentRating - 1500) / K_STUDENT;
    const iDelta = (1500 - r.newItemRating) / K_ITEM;
    expect(Math.abs(sDelta - iDelta)).toBeLessThan(1e-9);
  });

  it('a surprising upset moves a low-rated student much more than an expected win', () => {
    const upset = updateElo({ studentRating: 1200, itemRating: 1800, correct: true });
    const expected = updateElo({ studentRating: 1800, itemRating: 1200, correct: true });
    expect(upset.newStudentRating - 1200).toBeGreaterThan(expected.newStudentRating - 1800);
  });
});

describe('confidenceFromN', () => {
  it('returns 0 at n=0', () => {
    expect(confidenceFromN(0)).toBe(0);
  });

  it('approaches 1 as n grows', () => {
    expect(confidenceFromN(1_000)).toBeGreaterThan(0.95);
  });

  it('is monotonically non-decreasing', () => {
    let last = 0;
    for (let n = 0; n < 200; n += 5) {
      const c = confidenceFromN(n);
      expect(c).toBeGreaterThanOrEqual(last);
      last = c;
    }
  });
});

describe('applyAttempt — stateful chaining', () => {
  it('keeps ratings near 1500 over many balanced attempts', () => {
    const s = newStudentAbility('alice', 'calculus');
    const i = newItemDifficulty('item_a', 'calculus');
    // Alternate correct / incorrect — over time the rating should oscillate near 1500.
    for (let k = 0; k < 20; k++) applyAttempt(s, i, k % 2 === 0);
    expect(Math.abs(s.rating - ELO_INITIAL)).toBeLessThan(100);
    expect(s.n).toBe(20);
    expect(i.n).toBe(20);
  });

  it('separates a strong student from a hard item over enough attempts', () => {
    const s = newStudentAbility('strong', 'algebra');
    const i = newItemDifficulty('easy_item', 'algebra');
    // The student gets it right every time. Ratings should diverge.
    for (let k = 0; k < 50; k++) applyAttempt(s, i, true);
    // Student moves fast (K=32); item moves slow (K=8) by design — §3.1.
    // What we assert is the rating gap, not absolute thresholds.
    expect(s.rating).toBeGreaterThan(1600);
    expect(i.rating).toBeLessThan(1500);
    expect(s.rating - i.rating).toBeGreaterThan(200);
  });
});

describe('toAbility / itemDifficultyTrustworthy', () => {
  it('toAbility surfaces n and confidence', () => {
    const s = newStudentAbility('a', 'b');
    s.rating = 1600;
    s.n = 40;
    const a = toAbility(s);
    expect(a.rating).toBe(1600);
    expect(a.n).toBe(40);
    expect(a.confidence).toBeGreaterThan(0.5);
  });

  it('item difficulty isn’t trusted before ~100 attempts', () => {
    const i = newItemDifficulty('x', 'y');
    i.n = 50;
    expect(itemDifficultyTrustworthy(i)).toBe(false);
    i.n = 150;
    expect(itemDifficultyTrustworthy(i)).toBe(true);
  });
});
