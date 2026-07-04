/**
 * Tests for src/scoring/learning-object-catalog-pg.ts — DB-less fallback.
 *
 * No live Postgres in this test environment. `PgLearningObjectCatalog`
 * must behave as an honest empty catalog when DATABASE_URL is unset,
 * never throwing — matching the repo's DB-less demo-mode contract.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PgLearningObjectCatalog, getLearningObjectCatalog } from '../learning-object-catalog-pg';

describe('PgLearningObjectCatalog — DB-less', () => {
  const originalUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (originalUrl !== undefined) process.env.DATABASE_URL = originalUrl;
    else delete process.env.DATABASE_URL;
  });

  it('query() returns an empty array without a DATABASE_URL', async () => {
    const catalog = new PgLearningObjectCatalog();
    const rows = await catalog.query({ skillId: 'eigenvalues' });
    expect(rows).toEqual([]);
  });

  it('query() never throws even with a restrictive filter', async () => {
    const catalog = new PgLearningObjectCatalog();
    await expect(catalog.query({
      skillId: 'eigenvalues',
      types: ['practice'],
      diffMin: 600,
      diffMax: 2400,
      limit: 10,
    })).resolves.toEqual([]);
  });

  it('query() returns empty for a non-practice-only type filter (this table only backs practice)', async () => {
    const catalog = new PgLearningObjectCatalog();
    const rows = await catalog.query({ skillId: 'eigenvalues', types: ['manim'] });
    expect(rows).toEqual([]);
  });

  it('exposureCount() returns 0 without a DATABASE_URL', async () => {
    const catalog = new PgLearningObjectCatalog();
    const n = await catalog.exposureCount('some-object-id');
    expect(n).toBe(0);
  });

  it('getLearningObjectCatalog() returns a singleton that behaves DB-lessly', async () => {
    const catalog = getLearningObjectCatalog();
    const rows = await catalog.query({ skillId: 'eigenvalues' });
    expect(rows).toEqual([]);
  });
});
