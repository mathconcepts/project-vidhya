/**
 * ab-tester tests — bucket determinism + DB-less graceful path.
 *
 * The DB-dependent paths (createExperiment, evaluateRipeExperiments) are
 * verified for graceful no-op without DATABASE_URL. Live integration is
 * verified once VIDHYA_AB_TESTING=on in production.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createExperiment,
  getRunningExperiment,
  assignBucket,
  evaluateRipeExperiments,
  AB_WINDOW_DAYS,
  AB_MIN_BUCKET_SIZE,
  AB_MIN_DELTA,
} from '../ab-tester';
import { _internals } from '../ab-tester';

describe('ab-tester DB-less', () => {
  const origDb = process.env.DATABASE_URL;
  beforeEach(() => { delete process.env.DATABASE_URL; });
  afterEach(() => { if (origDb) process.env.DATABASE_URL = origDb; });

  it('createExperiment returns null without DB', async () => {
    expect(await createExperiment('a.b', 1, 2)).toBeNull();
  });

  it('getRunningExperiment returns null without DB', async () => {
    expect(await getRunningExperiment('a.b')).toBeNull();
  });

  it('assignBucket returns null when no experiment exists', async () => {
    expect(await assignBucket('a.b', 'student-1')).toBeNull();
  });

  it('evaluateRipeExperiments returns empty array without DB', async () => {
    const r = await evaluateRipeExperiments();
    expect(r).toEqual([]);
  });

  it('exposes default constants', () => {
    expect(AB_WINDOW_DAYS).toBe(14);
    expect(AB_MIN_BUCKET_SIZE).toBe(20);
    expect(AB_MIN_DELTA).toBeCloseTo(0.10);
  });
});

describe('ab-tester bucket determinism', () => {
  it('same student + same atom always lands in the same bucket', () => {
    const { bucketFor } = _internals;
    const a = bucketFor('calc.intuition', 'student-42');
    const b = bucketFor('calc.intuition', 'student-42');
    const c = bucketFor('calc.intuition', 'student-42');
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('different atom_ids produce a roughly even bucket distribution for one student', () => {
    const { bucketFor } = _internals;
    let control = 0, candidate = 0;
    for (let i = 0; i < 1000; i++) {
      const bucket = bucketFor(`atom-${i}.intuition`, 'student-42');
      if (bucket === 'control') control++;
      else candidate++;
    }
    // Independence-of-experiments contract: a single student should land in
    // both buckets across many atoms. Looser bound (35/65) than the
    // student-distribution test because shared prefixes can correlate.
    const ratio = control / (control + candidate);
    expect(ratio).toBeGreaterThan(0.35);
    expect(ratio).toBeLessThan(0.65);
  });

  it('different students roughly 50/50 across buckets', () => {
    const { bucketFor } = _internals;
    let control = 0, candidate = 0;
    for (let i = 0; i < 1000; i++) {
      const bucket = bucketFor('calc.intuition', `student-${i}`);
      if (bucket === 'control') control++;
      else candidate++;
    }
    // Expect 50/50 ± 10%. FNV-1a is uniform enough on this sample size.
    const ratio = control / (control + candidate);
    expect(ratio).toBeGreaterThan(0.40);
    expect(ratio).toBeLessThan(0.60);
  });

  it('FNV-1a is unsigned 32-bit positive', () => {
    const { fnv1a } = _internals;
    const samples = ['', 'a', 'student-1', 'calc.intuition::student-42', '🚀'];
    for (const s of samples) {
      const h = fnv1a(s);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
      expect(Number.isInteger(h)).toBe(true);
    }
  });
});
