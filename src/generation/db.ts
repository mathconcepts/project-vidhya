/**
 * src/generation/db.ts
 *
 * Pool helper for the generation module. Mirrors src/experiments/db.ts.
 * Returns null in DB-less mode so callers no-op gracefully.
 */

import pg from 'pg';

const { Pool } = pg;
let _pool: pg.Pool | null = null;

export function getGenerationPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return _pool;
}
