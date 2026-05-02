/**
 * src/experiments/db.ts
 *
 * Thin pool helper. Mirrors the lazy-pool pattern used by other modules
 * (e.g. src/jobs/cohort-aggregator.ts). Returns null in DB-less mode so
 * callers can no-op gracefully (anonymous demos, tests without a DB).
 */

import pg from 'pg';

const { Pool } = pg;
let _pool: pg.Pool | null = null;

export function getExperimentsPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return _pool;
}

/** Test-only: reset the cached pool. Used by integration tests. */
export function __resetExperimentsPool(): void {
  if (_pool) {
    void _pool.end().catch(() => undefined);
  }
  _pool = null;
}
