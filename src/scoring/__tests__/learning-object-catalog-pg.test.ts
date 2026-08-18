/**
 * Tests for src/scoring/learning-object-catalog-pg.ts — DB-less fallback.
 *
 * No live Postgres in this test environment. `PgLearningObjectCatalog`
 * must behave as an honest empty catalog when DATABASE_URL is unset,
 * never throwing — matching the repo's DB-less demo-mode contract.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PgLearningObjectCatalog, getLearningObjectCatalog, __resetCatalogForTests } from '../learning-object-catalog-pg';
import { CompositeLearningObjectCatalog } from '../learning-object-catalog-composite';

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

  it('getById() returns null without a DATABASE_URL (Wave 8)', async () => {
    const catalog = new PgLearningObjectCatalog();
    await expect(catalog.getById('some-object-id')).resolves.toBeNull();
  });

  it('exposureCount() returns 0 without a DATABASE_URL', async () => {
    const catalog = new PgLearningObjectCatalog();
    const n = await catalog.exposureCount('some-object-id');
    expect(n).toBe(0);
  });

  it('getLearningObjectCatalog() falls back to authored items without a DATABASE_URL', async () => {
    // CHANGED 2026-08-15. This previously asserted `[]` — correct while the pg
    // catalog was the only implementation, and the reason a DB-less deploy had
    // no gradable item at all: /api/practice/item/:id 404'd for everything, so
    // "the win is earned on a real item" had nothing behind it. An offline demo
    // venue runs exactly that configuration.
    //
    // The singleton now returns FileLearningObjectCatalog when DATABASE_URL is
    // unset, so a DB-less instance degrades to a smaller REAL catalog instead of
    // to none. The PgLearningObjectCatalog assertions above are unchanged and
    // still hold — that class still returns nothing without a database; it is
    // the resolver's choice of implementation that changed.
    const catalog = getLearningObjectCatalog();
    const rows = await catalog.query({ skillId: 'eigenvalues' });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.nodeId === 'eigenvalues')).toBe(true);
  });

  it('getLearningObjectCatalog() composes file + pg when DATABASE_URL IS set (T21)', async () => {
    // T21: this used to be strictly file-XOR-pg on DATABASE_URL — with a
    // database configured, authored file items became invisible. The
    // singleton must now hand back a composite, not a bare pg catalog.
    process.env.DATABASE_URL = 'postgres://fake:fake@localhost:5432/fake';
    __resetCatalogForTests();
    const catalog = getLearningObjectCatalog();
    expect(catalog).toBeInstanceOf(CompositeLearningObjectCatalog);
    __resetCatalogForTests();
  });
});
