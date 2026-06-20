/**
 * Tests for src/gbrain/fsrs.ts — FSRS memory model.
 * Pure functions; no DB / network.
 */

import { describe, it, expect } from 'vitest';
import {
  retrievability,
  intervalForRetention,
  initCard,
  reviewCard,
  recallProbability,
  ratingFromAttempt,
  FSRS_DEFAULT_TARGET,
} from '../fsrs';

const NOW = new Date('2026-06-20T00:00:00.000Z');

describe('retrievability', () => {
  it('is 1 at elapsed=0', () => {
    expect(retrievability(10, 0)).toBe(1);
  });

  it('decays monotonically with elapsed days', () => {
    const r1 = retrievability(10, 1);
    const r10 = retrievability(10, 10);
    const r100 = retrievability(10, 100);
    expect(r1).toBeGreaterThan(r10);
    expect(r10).toBeGreaterThan(r100);
  });

  it('high-stability cards decay slower than low-stability cards', () => {
    expect(retrievability(100, 30)).toBeGreaterThan(retrievability(5, 30));
  });
});

describe('intervalForRetention', () => {
  it('grows with stability', () => {
    expect(intervalForRetention(20)).toBeGreaterThan(intervalForRetention(5));
  });

  it('roundtrips: at the returned interval, retrievability hits target', () => {
    const s = 25;
    const target = FSRS_DEFAULT_TARGET;
    const days = intervalForRetention(s, target);
    expect(retrievability(s, days)).toBeCloseTo(target, 6);
  });
});

describe('initCard', () => {
  it('produces a future due date and reps=1', () => {
    const c = initCard(3, NOW);
    expect(c.reps).toBe(1);
    expect(c.lapses).toBe(0);
    expect(new Date(c.dueAt).getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('a lapse on first review counts as a lapse', () => {
    const c = initCard(1, NOW);
    expect(c.lapses).toBe(1);
  });

  it('easy rating yields larger stability than hard', () => {
    const easy = initCard(4, NOW);
    const hard = initCard(2, NOW);
    expect(easy.stability).toBeGreaterThan(hard.stability);
  });
});

describe('reviewCard', () => {
  it('a Good review grows stability and pushes due_at out', () => {
    const c0 = initCard(3, NOW);
    const later = new Date(c0.dueAt);
    const { card, intervalDays } = reviewCard(c0, 3, later);
    expect(card.stability).toBeGreaterThan(c0.stability);
    expect(card.reps).toBe(2);
    expect(intervalDays).toBeGreaterThanOrEqual(1);
    expect(new Date(card.dueAt).getTime()).toBeGreaterThan(later.getTime());
  });

  it('an Again review counts a lapse and stability does not grow', () => {
    const c0 = initCard(3, NOW);
    const later = new Date(c0.dueAt);
    const { card } = reviewCard(c0, 1, later);
    expect(card.lapses).toBe(c0.lapses + 1);
    expect(card.stability).toBeLessThanOrEqual(c0.stability);
  });

  it('Easy review yields a longer interval than Good', () => {
    const c0 = initCard(3, NOW);
    const later = new Date(c0.dueAt);
    const easy = reviewCard(c0, 4, later);
    const good = reviewCard(c0, 3, later);
    expect(easy.intervalDays).toBeGreaterThanOrEqual(good.intervalDays);
  });
});

describe('recallProbability', () => {
  it('decays from ~1 to ~target by the due date (default target=0.9)', () => {
    const c = initCard(3, NOW);
    const due = new Date(c.dueAt);
    // At due date retrievability should be approximately the target.
    expect(recallProbability(c, due)).toBeCloseTo(FSRS_DEFAULT_TARGET, 1);
  });
});

describe('ratingFromAttempt', () => {
  it('incorrect → Again', () => {
    expect(ratingFromAttempt(false, 10)).toBe(1);
  });

  it('correct + fast → Easy', () => {
    expect(ratingFromAttempt(true, 5)).toBe(4);
  });

  it('correct + medium → Good', () => {
    expect(ratingFromAttempt(true, 30)).toBe(3);
  });

  it('correct + slow → Hard', () => {
    expect(ratingFromAttempt(true, 120)).toBe(2);
  });
});
