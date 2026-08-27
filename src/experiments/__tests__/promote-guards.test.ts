/**
 * Tests for src/experiments/promote-guards.ts (W1.6).
 *
 * Pure-function fixtures on both sides of each guard's boundary — same
 * style as src/experiments/__tests__/ledger-suggestions.test.ts. The
 * wiring into learnings-ledger.ts (guard trip → operator-review
 * suggestion instead of auto-promote) is covered separately in
 * src/jobs/__tests__/learnings-ledger-guards.test.ts.
 */

import { describe, it, expect } from 'vitest';
import {
  immediateLiftFlatRetention,
  modeSplitRegression,
  speedUpErrorsUp,
  __testing,
} from '../promote-guards';

describe('immediateLiftFlatRetention', () => {
  it('insufficient data: no lift_v1/lift_n at all', () => {
    const r = immediateLiftFlatRetention({ liftV1: null, liftN: null, delayedMasteryDelta: null, delayedN: null });
    expect(r.tripped).toBe(false);
    expect(r.reason).toContain('insufficient data');
  });

  it('lift not worth checking (at or below the threshold) never trips, regardless of delayed data', () => {
    const r = immediateLiftFlatRetention({
      liftV1: __testing.IMMEDIATE_LIFT_THRESHOLD, liftN: 50,
      delayedMasteryDelta: -0.1, delayedN: 50,
    });
    expect(r.tripped).toBe(false);
    expect(r.reason).toContain('not an immediate lift worth checking');
  });

  it('insufficient data: delayed window has n below the floor', () => {
    const r = immediateLiftFlatRetention({
      liftV1: 0.1, liftN: 50,
      delayedMasteryDelta: 0.09, delayedN: __testing.RETENTION_MIN_N - 1,
    });
    expect(r.tripped).toBe(false);
    expect(r.reason).toContain('insufficient data');
    expect(r.reason).toContain(String(__testing.RETENTION_MIN_N - 1));
  });

  it('trips exactly at the flat ceiling (delayed delta == ceiling)', () => {
    const r = immediateLiftFlatRetention({
      liftV1: 0.1, liftN: 50,
      delayedMasteryDelta: __testing.RETENTION_FLAT_CEILING, delayedN: __testing.RETENTION_MIN_N,
    });
    expect(r.tripped).toBe(true);
    expect(r.reason).toContain('does not appear to hold');
  });

  it('trips on a NEGATIVE delayed delta (the gain reversed)', () => {
    const r = immediateLiftFlatRetention({
      liftV1: 0.12, liftN: 60,
      delayedMasteryDelta: -0.03, delayedN: 40,
    });
    expect(r.tripped).toBe(true);
  });

  it('does not trip just above the flat ceiling — retention holds', () => {
    const r = immediateLiftFlatRetention({
      liftV1: 0.1, liftN: 50,
      delayedMasteryDelta: __testing.RETENTION_FLAT_CEILING + 0.001, delayedN: __testing.RETENTION_MIN_N,
    });
    expect(r.tripped).toBe(false);
    expect(r.reason).toContain('retention holds');
  });

  it('reason names the actual numbers (D8 precision)', () => {
    const r = immediateLiftFlatRetention({
      liftV1: 0.1234, liftN: 55,
      delayedMasteryDelta: 0.002, delayedN: 33,
    });
    expect(r.reason).toContain('+0.1234');
    expect(r.reason).toContain('n=55');
    expect(r.reason).toContain('n=33');
  });
});

describe('modeSplitRegression', () => {
  const MIN_N = __testing.MODE_SPLIT_MIN_N;

  it('insufficient data: missing a kind entirely', () => {
    const r = modeSplitRegression({ byKind: [{ kind: 'mcq', accuracyPre: 0.5, nPre: MIN_N, accuracyPost: 0.6, nPost: MIN_N }] });
    expect(r.tripped).toBe(false);
    expect(r.reason).toContain('insufficient data');
  });

  it('insufficient data: n below the floor on one side', () => {
    const r = modeSplitRegression({
      byKind: [
        { kind: 'mcq', accuracyPre: 0.5, nPre: MIN_N - 1, accuracyPost: 0.6, nPost: MIN_N },
        { kind: 'nat', accuracyPre: 0.5, nPre: MIN_N, accuracyPost: 0.4, nPost: MIN_N },
      ],
    });
    expect(r.tripped).toBe(false);
    expect(r.reason).toContain('insufficient data');
  });

  it('trips exactly at both thresholds (mcq +0.03, nat -0.03)', () => {
    const r = modeSplitRegression({
      byKind: [
        { kind: 'mcq', accuracyPre: 0.50, nPre: MIN_N, accuracyPost: 0.50 + __testing.MODE_SPLIT_UP_THRESHOLD, nPost: MIN_N },
        { kind: 'nat', accuracyPre: 0.50, nPre: MIN_N, accuracyPost: 0.50 + __testing.MODE_SPLIT_DOWN_THRESHOLD, nPost: MIN_N },
      ],
    });
    expect(r.tripped).toBe(true);
    expect(r.reason).toContain('guessable-mode-only gains');
  });

  it('does not trip when MCQ rises but NAT also rises (general improvement)', () => {
    const r = modeSplitRegression({
      byKind: [
        { kind: 'mcq', accuracyPre: 0.5, nPre: MIN_N, accuracyPost: 0.6, nPost: MIN_N },
        { kind: 'nat', accuracyPre: 0.5, nPre: MIN_N, accuracyPost: 0.55, nPost: MIN_N },
      ],
    });
    expect(r.tripped).toBe(false);
    expect(r.reason).toContain('no mode-split regression');
  });

  it('does not trip when both fall (a general regression, not a mode split)', () => {
    const r = modeSplitRegression({
      byKind: [
        { kind: 'mcq', accuracyPre: 0.5, nPre: MIN_N, accuracyPost: 0.4, nPost: MIN_N },
        { kind: 'nat', accuracyPre: 0.5, nPre: MIN_N, accuracyPost: 0.4, nPost: MIN_N },
      ],
    });
    expect(r.tripped).toBe(false);
  });

  it('does not trip just under the thresholds', () => {
    const r = modeSplitRegression({
      byKind: [
        { kind: 'mcq', accuracyPre: 0.5, nPre: MIN_N, accuracyPost: 0.5 + __testing.MODE_SPLIT_UP_THRESHOLD - 0.001, nPost: MIN_N },
        { kind: 'nat', accuracyPre: 0.5, nPre: MIN_N, accuracyPost: 0.5 + __testing.MODE_SPLIT_DOWN_THRESHOLD + 0.001, nPost: MIN_N },
      ],
    });
    expect(r.tripped).toBe(false);
  });
});

describe('speedUpErrorsUp', () => {
  const MIN_N = __testing.SPEED_MIN_N;

  it('insufficient data: n below the floor', () => {
    const r = speedUpErrorsUp({
      meanBucketIndexPre: 2, meanBucketIndexPost: 1, accuracyPre: 0.6, accuracyPost: 0.4, n: MIN_N - 1,
    });
    expect(r.tripped).toBe(false);
    expect(r.reason).toContain('insufficient data');
  });

  it('insufficient data: a null field', () => {
    const r = speedUpErrorsUp({
      meanBucketIndexPre: null, meanBucketIndexPost: 1, accuracyPre: 0.6, accuracyPost: 0.4, n: MIN_N,
    });
    expect(r.tripped).toBe(false);
    expect(r.reason).toContain('insufficient data');
  });

  it('trips exactly at both thresholds', () => {
    const r = speedUpErrorsUp({
      meanBucketIndexPre: 2, meanBucketIndexPost: 2 - __testing.SPEED_BUCKET_DROP_THRESHOLD,
      accuracyPre: 0.6, accuracyPost: 0.6 - __testing.SPEED_ACCURACY_DROP_THRESHOLD,
      n: MIN_N,
    });
    expect(r.tripped).toBe(true);
    expect(r.reason).toContain('faster and getting more wrong');
  });

  it('does not trip when latency drops but accuracy holds', () => {
    const r = speedUpErrorsUp({
      meanBucketIndexPre: 2, meanBucketIndexPost: 1, accuracyPre: 0.6, accuracyPost: 0.61, n: MIN_N,
    });
    expect(r.tripped).toBe(false);
  });

  it('does not trip when accuracy falls but latency does not drop (students just got worse, not rushing)', () => {
    const r = speedUpErrorsUp({
      meanBucketIndexPre: 2, meanBucketIndexPost: 2, accuracyPre: 0.6, accuracyPost: 0.4, n: MIN_N,
    });
    expect(r.tripped).toBe(false);
  });

  it('does not trip just under both thresholds', () => {
    const r = speedUpErrorsUp({
      meanBucketIndexPre: 2, meanBucketIndexPost: 2 - __testing.SPEED_BUCKET_DROP_THRESHOLD + 0.01,
      accuracyPre: 0.6, accuracyPost: 0.6 - __testing.SPEED_ACCURACY_DROP_THRESHOLD + 0.01,
      n: MIN_N,
    });
    expect(r.tripped).toBe(false);
  });

  it('reason names bucket labels and n (D8 precision)', () => {
    const r = speedUpErrorsUp({
      meanBucketIndexPre: 3, meanBucketIndexPost: 0, accuracyPre: 0.7, accuracyPost: 0.2, n: 40,
    });
    expect(r.reason).toContain('gt90s');
    expect(r.reason).toContain('lt10s');
    expect(r.reason).toContain('n=40');
  });
});
