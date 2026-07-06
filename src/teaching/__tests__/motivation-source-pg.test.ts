/**
 * Tests for src/teaching/motivation-source-pg.ts — DB-less fallback.
 *
 * No live Postgres in this test environment. PgMotivationSource must
 * behave as an honest cold-start (null) source when DATABASE_URL is
 * unset, never throwing — same contract as PgLearningObjectCatalog.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PgMotivationSource,
  getMotivationSource,
  setMotivationSourceForTests,
  InMemoryMotivationSource,
} from '../motivation-source-pg';

describe('PgMotivationSource — DB-less', () => {
  const originalUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    setMotivationSourceForTests(null);
  });

  afterEach(() => {
    if (originalUrl !== undefined) process.env.DATABASE_URL = originalUrl;
    else delete process.env.DATABASE_URL;
    setMotivationSourceForTests(null);
  });

  it('stateFor() returns null (cold start) without a DATABASE_URL', async () => {
    const source = new PgMotivationSource();
    await expect(source.stateFor('student-1')).resolves.toBeNull();
  });

  it('getMotivationSource() returns a singleton that behaves DB-lessly', async () => {
    const a = getMotivationSource();
    const b = getMotivationSource();
    expect(a).toBe(b);
    await expect(a.stateFor('student-1')).resolves.toBeNull();
  });

  it('setMotivationSourceForTests() swaps the singleton', async () => {
    const seeded = new InMemoryMotivationSource({ 's1': 'anxious' });
    setMotivationSourceForTests(seeded);
    await expect(getMotivationSource().stateFor('s1')).resolves.toBe('anxious');
    await expect(getMotivationSource().stateFor('s2')).resolves.toBeNull();
  });
});
