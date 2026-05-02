/**
 * Unit tests for the stats helpers in lift.ts.
 *
 * The DB-touching code path is integration-tested separately with a
 * Postgres test container. These tests cover the pure-math primitives.
 */

import { describe, it, expect } from 'vitest';
import { __testing } from '../lift';

const { mean, variance, welchPValue, normalCdf } = __testing;

describe('mean', () => {
  it('returns 0 for empty input', () => {
    expect(mean([])).toBe(0);
  });
  it('computes arithmetic mean', () => {
    expect(mean([1, 2, 3, 4])).toBeCloseTo(2.5, 5);
  });
});

describe('variance', () => {
  it('returns 0 for tiny samples', () => {
    expect(variance([])).toBe(0);
    expect(variance([42])).toBe(0);
  });
  it('uses sample (n-1) denominator', () => {
    expect(variance([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(4.571429, 4);
  });
});

describe('normalCdf', () => {
  it('is 0.5 at zero', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 3);
  });
  it('approaches 1 at +∞', () => {
    expect(normalCdf(5)).toBeGreaterThan(0.999);
  });
  it('approaches 0 at −∞', () => {
    expect(normalCdf(-5)).toBeLessThan(0.001);
  });
  it('matches z=1.96 → ~0.975', () => {
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 2);
  });
});

describe("welchPValue", () => {
  it('returns 1 with insufficient data', () => {
    expect(welchPValue([1], [2, 3])).toBe(1);
    expect(welchPValue([1, 2], [])).toBe(1);
  });

  it('returns ~1 for identical distributions', () => {
    const a = [0.1, 0.2, 0.15, 0.18, 0.22, 0.13, 0.19, 0.21];
    expect(welchPValue(a, a)).toBeCloseTo(1, 3);
  });

  it('returns small p for clearly different distributions', () => {
    const treatment = [0.5, 0.55, 0.52, 0.6, 0.48, 0.53, 0.51, 0.57, 0.49, 0.54];
    const control = [0.1, 0.12, 0.08, 0.15, 0.11, 0.09, 0.13, 0.07, 0.14, 0.1];
    const p = welchPValue(treatment, control);
    expect(p).toBeLessThan(0.001);
  });

  it('returns large p for noisy overlapping distributions', () => {
    const a = [0.3, 0.5, 0.4, 0.6, 0.35, 0.45, 0.55, 0.4];
    const b = [0.4, 0.45, 0.5, 0.35, 0.55, 0.4, 0.6, 0.42];
    const p = welchPValue(a, b);
    expect(p).toBeGreaterThan(0.1);
  });
});
