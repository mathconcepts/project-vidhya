/**
 * queue.ts ranking tests — DB-less mode.
 *
 * Verifies the queue produces a sorted output even when DB is unavailable
 * (admin still sees the concept list, just without prioritization signal).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildQueue } from '../queue';

describe('buildQueue (DB unavailable)', () => {
  const original = process.env.DATABASE_URL;
  beforeEach(() => { delete process.env.DATABASE_URL; });
  afterEach(() => { if (original) process.env.DATABASE_URL = original; });

  it('returns concept rows sorted by impact', async () => {
    const rows = await buildQueue({ limit: 100 });
    expect(rows.length).toBeGreaterThan(0);
    // Sorted: each row's impact >= the next.
    for (let i = 0; i < rows.length - 1; i++) {
      expect(rows[i].impact).toBeGreaterThanOrEqual(rows[i + 1].impact);
    }
  });

  it('honors limit', async () => {
    const rows = await buildQueue({ limit: 3 });
    expect(rows.length).toBeLessThanOrEqual(3);
  });

  it('marks all concepts as missing when no atoms exist', async () => {
    const rows = await buildQueue({ limit: 5 });
    for (const r of rows) {
      expect(r.atoms_existing).toBe(0);
      expect(r.atoms_to_generate).toBe(11);
      expect(r.state).toBe('missing');
    }
  });

  it('cost meter shows zero spend without DB', async () => {
    const rows = await buildQueue({ limit: 5 });
    for (const r of rows) {
      expect(r.spent_usd).toBe(0);
      expect(r.cap_usd).toBeGreaterThan(0);
    }
  });

  it('filters by topic_family', async () => {
    const rows = await buildQueue({ limit: 100, topic_families: ['calculus'] });
    for (const r of rows) {
      expect(r.topic_family).toBe('calculus');
    }
  });

  it('filters by state', async () => {
    const rows = await buildQueue({ limit: 100, states: ['missing'] });
    for (const r of rows) {
      expect(r.state).toBe('missing');
    }
  });
});
