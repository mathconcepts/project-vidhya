/**
 * Tests for src/gbrain/fsrs-shadow.ts — Wave 12 / A7 shadow mode.
 *
 * Covers the signed-off A7 mappings (§2 quality→rating, §3 state
 * migration), the "no review-queue jump on migration day" acceptance
 * property the spec commits to, and the DB-less no-op contract.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ratingFromQuality,
  stabilityFromInterval,
  difficultyFromEase,
  cardFromSm2,
  shadowNextDue,
  logShadowEvent,
  shadowSummary,
  resetShadowPoolForTests,
} from '../fsrs-shadow';
import { intervalForRetention } from '../fsrs';

describe('A7 §2 — quality → rating', () => {
  it('maps the retention scale (0–5) per the table', () => {
    expect(ratingFromQuality(0, 'retention')).toBe(1);
    expect(ratingFromQuality(1, 'retention')).toBe(1);
    expect(ratingFromQuality(2, 'retention')).toBe(2);
    expect(ratingFromQuality(3, 'retention')).toBe(3);
    expect(ratingFromQuality(4, 'retention')).toBe(3);
    expect(ratingFromQuality(5, 'retention')).toBe(4);
  });

  it('maps the lessons scale (0–4) with no easy — capped conservatism', () => {
    expect(ratingFromQuality(0, 'lessons')).toBe(1);
    expect(ratingFromQuality(2, 'lessons')).toBe(2);
    expect(ratingFromQuality(3, 'lessons')).toBe(3);
    expect(ratingFromQuality(4, 'lessons')).toBe(3);
  });
});

describe('A7 §3 — state migration formulas', () => {
  it('stability ← interval, floored at 0.5', () => {
    expect(stabilityFromInterval(10)).toBe(10);
    expect(stabilityFromInterval(0)).toBe(0.5);
  });

  it('difficulty ← clamp(11 − 2.8·ease): anchors from the spec', () => {
    expect(difficultyFromEase(2.5)).toBeCloseTo(4, 5);      // SM-2 default → typical
    expect(difficultyFromEase(1.3)).toBeCloseTo(7.36, 2);   // floor ease → hard
    expect(difficultyFromEase(3.0)).toBeCloseTo(2.6, 5);    // easy
    expect(difficultyFromEase(0.5)).toBe(9.6);
    expect(difficultyFromEase(4.0)).toBe(1);                // clamped
  });

  it('ACCEPTANCE: migrated cards are due within ±1 day of their SM-2 due date', () => {
    // stability ← interval and intervalForRetention(s, 0.9) ≡ s by the
    // FSRS_FACTOR normalization — verify across the realistic state space.
    for (const interval of [1, 2, 3, 7, 16, 35, 60, 120]) {
      expect(Math.abs(intervalForRetention(interval) - interval)).toBeLessThan(1e-9);
      for (const ease of [1.3, 2.0, 2.5, 3.0]) {
        const last = new Date('2026-07-01T00:00:00Z');
        const card = cardFromSm2({
          intervalDays: interval, easeFactor: ease,
          lastReviewedAt: last.toISOString(), reps: 3,
        });
        const sm2Due = new Date(last);
        sm2Due.setDate(sm2Due.getDate() + interval);
        const deltaDays = Math.abs(new Date(card.dueAt).getTime() - sm2Due.getTime()) / 86_400_000;
        expect(deltaDays).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('shadowNextDue', () => {
  const now = new Date('2026-07-06T12:00:00Z');

  it('uses initCard for first encounters (no prior state)', () => {
    const { fsrsDueAt, rating } = shadowNextDue({ prior: null, quality: 4, scale: 'retention', now });
    expect(rating).toBe(3);
    expect(new Date(fsrsDueAt).getTime()).toBeGreaterThan(now.getTime());
  });

  it('reviews the migrated card for existing state; again schedules sooner than good', () => {
    const prior = {
      intervalDays: 16, easeFactor: 2.5,
      lastReviewedAt: new Date('2026-06-20T00:00:00Z').toISOString(), reps: 4,
    };
    const good = shadowNextDue({ prior, quality: 4, scale: 'retention', now });
    const again = shadowNextDue({ prior, quality: 0, scale: 'retention', now });
    expect(new Date(again.fsrsDueAt).getTime()).toBeLessThan(new Date(good.fsrsDueAt).getTime());
  });
});

describe('DB-less contract', () => {
  const originalUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    resetShadowPoolForTests();
  });

  afterEach(() => {
    if (originalUrl !== undefined) process.env.DATABASE_URL = originalUrl;
    else delete process.env.DATABASE_URL;
    resetShadowPoolForTests();
  });

  it('logShadowEvent resolves silently without a DATABASE_URL', async () => {
    await expect(logShadowEvent({
      site: 'lessons', studentId: 's1', itemKey: 'c1', quality: 3, rating: 3,
      sm2DueAt: new Date().toISOString(), fsrsDueAt: new Date().toISOString(),
    })).resolves.toBeUndefined();
  });

  it('shadowSummary reports honestly that nothing was collected', async () => {
    const s = await shadowSummary();
    expect(s.events).toBe(0);
    expect(s.exit_criterion_met).toBe(false);
    expect(s.reason).toMatch(/DB-less/);
  });
});
