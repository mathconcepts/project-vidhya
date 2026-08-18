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
 *
 * ── Exception policy (T16 / D4 / OV2 correction #10) ──────────────────
 *
 * `SHARED_POOL_MAX` bounds ONE process's connection footprint on this
 * pool. It is not the only pool a process may hold — a module with a
 * genuine reason to keep connections off the shared pool documents that
 * reason in its own file header and is listed here so the reason stays
 * auditable in one place:
 *
 *   - `src/generation/batch/pg-persistence.ts` — holds `pg_try_advisory_lock`
 *     for its per-run lock. This does NOT need a separate `Pool` instance:
 *     it correctly checks out one dedicated client via `pool.connect()`
 *     and pins that same client across `pg_try_advisory_lock` →
 *     `pg_advisory_unlock`, releasing it back to the pool only after
 *     unlock (see `lockClients` in that file). That pattern is safe on
 *     THIS shared pool. What it is NOT safe on is a transaction-mode
 *     PgBouncer/Supavisor connection string — transaction-mode pooling
 *     can reassign the physical backend connection between statements
 *     even while a single `pg.PoolClient` looks stable to node-postgres,
 *     which silently breaks advisory-lock semantics (they're tied to the
 *     Postgres backend session, not the app's TCP socket). Concretely:
 *     **if any module on this pool acquires an advisory lock, session
 *     variables, or `LISTEN/NOTIFY`, `DATABASE_URL` must point at a
 *     direct connection or a session-mode pooler — never transaction
 *     mode.** See docs/ops/render-database-url.md for the operator-facing
 *     version of this rule.
 *   - `checkConnectivity()` below — deliberately its own throwaway
 *     `max: 1` pool with a short `connectionTimeoutMillis`, so a health
 *     probe against an unreachable database can't hang or poison the
 *     shared pool with a bad connection.
 *   - One-shot CLI scripts (`scripts/*.ts`, `demo/*.ts`) build their own
 *     short-lived pool and exit the process when done — there is no
 *     "shared" to join; see the T16 audit table in
 *     docs/ops/render-database-url.md for the full inventory of what
 *     stayed on its own pool and why.
 *
 * A module NOT in this list that still constructs `new Pool(...)`
 * directly is either (a) not yet migrated — tracked in the T16 audit
 * table, migrate opportunistically — or (b) a bug. `npm run
 * ci:connection-budget` (scripts/check-connection-budget.ts) fails CI on
 * a NEW per-call `new Pool(...)` appearing inside an exported function on
 * the request path, which is the failure mode this file exists to close
 * off (a pool built fresh on every request, never freed, exhausting
 * Supabase's connection ceiling under load).
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
