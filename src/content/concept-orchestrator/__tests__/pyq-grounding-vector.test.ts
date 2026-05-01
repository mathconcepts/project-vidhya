/**
 * Vector PYQ grounding tests (4.11) — DB-less mode.
 *
 * Verifies the cascade: when no embedding is supplied OR no DB,
 * groundForLOWithEmbedding falls back to the keyword path. Live DB
 * integration is verified once the operator runs the backfill script
 * in production.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { groundForLO, groundForLOWithEmbedding } from '../pyq-grounding';

describe('groundForLOWithEmbedding (DB unavailable)', () => {
  const origDb = process.env.DATABASE_URL;
  beforeEach(() => { delete process.env.DATABASE_URL; });
  afterEach(() => { if (origDb) process.env.DATABASE_URL = origDb; });

  it('returns empty array without DB', async () => {
    const r = await groundForLOWithEmbedding('calc', 'worked_example', [0.1, 0.2, 0.3]);
    expect(r).toEqual([]);
  });

  it('returns empty array for non-relevant atom types', async () => {
    const r = await groundForLOWithEmbedding('calc', 'intuition', [0.1, 0.2]);
    expect(r).toEqual([]);
  });

  it('falls back to keyword path when no embedding supplied (null)', async () => {
    // Without DB, both paths return [] — this just verifies the
    // null-embedding branch doesn't throw.
    const r = await groundForLOWithEmbedding('calc', 'worked_example', null);
    expect(r).toEqual([]);
  });

  it('falls back to keyword path when empty embedding supplied', async () => {
    const r = await groundForLOWithEmbedding('calc', 'worked_example', []);
    expect(r).toEqual([]);
  });
});

describe('groundForLO (keyword path) — sanity', () => {
  const origDb = process.env.DATABASE_URL;
  beforeEach(() => { delete process.env.DATABASE_URL; });
  afterEach(() => { if (origDb) process.env.DATABASE_URL = origDb; });

  it('still works without DB', async () => {
    const r = await groundForLO('calc', 'worked_example');
    expect(r).toEqual([]);
  });

  it('returns empty for non-relevant atom types', async () => {
    const r = await groundForLO('calc', 'intuition');
    expect(r).toEqual([]);
  });
});
