/**
 * src/storage/pool.ts — the ONE shared Postgres connection pool (CEO plan
 * Phase 0, §5 storage boundary).
 *
 * Before this file, ~65 modules across the codebase each built their own
 * lazy `pg.Pool` with a hand-copied `let _pool; function getPool() {...}`
 * block — and the copies had already drifted: cohort-aggregator.ts used
 * `max: 5`, narration-experiment-scanner.ts used `max: 3`,
 * src/generation/db.ts used `max: 5`, src/experiments/db.ts used its own
 * value again. That's exactly the "parallel truths that drift" pattern
 * this Phase 0 exists to close — nobody could answer "what's our real pool
 * size ceiling" without grepping every file.
 *
 * This is the seam every repository in src/storage/repositories/ builds
 * on. It is NOT a full migration of every pg import in the codebase (see
 * the pg-allowlist in scripts/check-pg-allowlist.ts for what's left) —
 * it's the shared foundation new and migrated call sites use going
 * forward.
 */

import pg from 'pg';

const { Pool } = pg;

/** Single shared pool ceiling. Was inconsistently 3/5/5/10 across copies; picks the largest previously-used value so no caller regresses. */
export const SHARED_POOL_MAX = 10;

let _pool: pg.Pool | null = null;

/** Returns the shared pool, or null when DATABASE_URL is unset (DB-less mode — callers degrade honestly, never crash). */
export function getSharedPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: SHARED_POOL_MAX });
  return _pool;
}

/** Test-only: force a fresh pool on the next getSharedPool() call. */
export function __resetSharedPoolForTests(): void {
  _pool = null;
}

/** Closes the shared pool, if one was ever created. For graceful process shutdown / test teardown. */
export async function closeSharedPool(): Promise<void> {
  if (_pool) {
    await _pool.end().catch(() => {});
    _pool = null;
  }
}

export interface ConnectivityResult {
  ok: boolean;
  error?: string;
}

/**
 * Fast, short-timeout DATABASE_URL connectivity check (relocated from
 * src/jobs/db-preflight.ts — same behavior, now the canonical storage-layer
 * primitive). Deliberately does NOT use the shared pool: it needs its own
 * short connectionTimeoutMillis and must not poison the shared pool with a
 * connection to an unreachable database.
 */
export async function checkConnectivity(): Promise<ConnectivityResult> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return { ok: true };

  let pool: InstanceType<typeof Pool> | null = null;
  try {
    pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 3000 });
    await pool.query('SELECT 1');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}
