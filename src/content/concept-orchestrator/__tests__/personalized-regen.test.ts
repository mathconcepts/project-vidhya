/**
 * personalized-regen tests — DB-less mode + threshold contract.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  maybeQueueRegenForStudent,
  readStudentOverrides,
  PERSONAL_FAILURE_THRESHOLD,
  PERSONAL_FAILURE_WINDOW_DAYS,
  PERSONAL_OVERRIDE_TTL_DAYS,
} from '../personalized-regen';

describe('personalized-regen (DB unavailable)', () => {
  const original = process.env.DATABASE_URL;
  beforeEach(() => { delete process.env.DATABASE_URL; });
  afterEach(() => { if (original) process.env.DATABASE_URL = original; });

  it('maybeQueueRegenForStudent returns no_db when DATABASE_URL unset', async () => {
    const r = await maybeQueueRegenForStudent('student-1', 'calculus-derivatives.intuition');
    expect(r.queued).toBe(false);
    expect(r.reason).toBe('no_db');
  });

  it('returns unknown_concept for unknown concept ids', async () => {
    process.env.DATABASE_URL = 'postgres://invalid-host:1/x';
    const r = await maybeQueueRegenForStudent('s', 'no-such-concept.intuition');
    expect(r.queued).toBe(false);
    expect(r.reason).toBe('unknown_concept');
  });

  it('readStudentOverrides returns empty map without DB', async () => {
    const m = await readStudentOverrides('student-1', ['a.b', 'c.d']);
    expect(m.size).toBe(0);
  });

  it('readStudentOverrides returns empty map for empty input', async () => {
    const m = await readStudentOverrides('student-1', []);
    expect(m.size).toBe(0);
  });

  it('exposes threshold + window + TTL constants', () => {
    expect(PERSONAL_FAILURE_THRESHOLD).toBe(3);
    expect(PERSONAL_FAILURE_WINDOW_DAYS).toBe(7);
    expect(PERSONAL_OVERRIDE_TTL_DAYS).toBe(14);
  });
});
