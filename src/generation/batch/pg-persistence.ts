/**
 * src/generation/batch/pg-persistence.ts
 *
 * Postgres-backed BatchPersistence. Reads/writes the columns added by
 * migration 026 + the batch_jobs table. Uses pg_try_advisory_lock for
 * the per-run advisory lock so two pollers can't race.
 *
 * DB-less safe: returns null/empty everywhere when DATABASE_URL is unset.
 * The orchestrator will see "no in-flight runs" and the boot poller / cron
 * become no-ops — same pattern the rest of the codebase uses.
 */

import pg from 'pg';
import type { BatchPersistence, RunRow, JobRow } from './persistence';
import type { BatchProvider, BatchState, AtomSpec } from './types';

const { Pool } = pg;

let _pool: pg.Pool | null = null;

function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
  return _pool;
}

/**
 * Postgres advisory lock keys are bigints. We hash the run_id into one
 * deterministically so the same run always grabs the same key.
 */
function lockKeyFor(run_id: string): bigint {
  // FNV-1a over UTF-8 bytes; truncated to 63 bits (signed bigint).
  let h = 14695981039346656037n;
  for (const ch of run_id) {
    h ^= BigInt(ch.charCodeAt(0));
    h = (h * 1099511628211n) & 0xffffffffffffffffn;
  }
  return h & 0x7fffffffffffffffn;
}

/**
 * Per-pool dedicated client for advisory locks. Advisory locks are
 * session-scoped, so we hold a single client checked out for the lock's
 * lifetime. We use a small pool of dedicated clients keyed by run_id.
 */
const lockClients = new Map<string, pg.PoolClient>();

export function createPgPersistence(): BatchPersistence {
  return {
    async getRun(run_id) {
      const pool = getPool();
      if (!pool) return null;
      const r = await pool.query<RunRowDb>(
        `SELECT id, exam_pack_id, batch_provider, batch_id, batch_state, jsonl_path,
                budget_locked_usd::FLOAT8, COALESCE((config->>'budget_remaining_usd')::FLOAT8, 100) AS budget_remaining_usd,
                submitted_at::TEXT, last_polled_at::TEXT, error
           FROM generation_runs WHERE id = $1`,
        [run_id],
      );
      return r.rows[0] ? mapRun(r.rows[0]) : null;
    },

    async updateRun(run_id, patch) {
      const pool = getPool();
      if (!pool) return;
      const sets: string[] = [];
      const vals: unknown[] = [];
      let i = 1;
      for (const [k, v] of Object.entries(patch)) {
        const col = COLUMN_MAP[k];
        if (!col) continue;
        sets.push(`${col} = $${i++}`);
        vals.push(v);
      }
      if (sets.length === 0) return;
      vals.push(run_id);
      await pool.query(
        `UPDATE generation_runs SET ${sets.join(', ')} WHERE id = $${i}`,
        vals,
      );
    },

    async insertJobs(run_id, newJobs) {
      const pool = getPool();
      if (!pool) return;
      if (newJobs.length === 0) return;
      // One INSERT … ON CONFLICT DO NOTHING per row keeps the SQL simple
      // and lets the PK enforce idempotency.
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const j of newJobs) {
          await client.query(
            `INSERT INTO batch_jobs (run_id, custom_id, atom_spec, status)
               VALUES ($1, $2, $3::JSONB, 'pending')
               ON CONFLICT (run_id, custom_id) DO NOTHING`,
            [run_id, j.custom_id, JSON.stringify(j.atom_spec)],
          );
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    },

    async listJobs(run_id) {
      const pool = getPool();
      if (!pool) return [];
      const r = await pool.query<JobRowDb>(
        `SELECT run_id, custom_id, atom_spec, status, result, error,
                submitted_at::TEXT, processed_at::TEXT
           FROM batch_jobs WHERE run_id = $1
           ORDER BY custom_id`,
        [run_id],
      );
      return r.rows.map(mapJob);
    },

    async setJobResult(run_id, custom_id, patch) {
      const pool = getPool();
      if (!pool) return;
      const sets: string[] = [];
      const vals: unknown[] = [];
      let i = 1;
      for (const [k, v] of Object.entries(patch)) {
        const col = JOB_COLUMN_MAP[k];
        if (!col) continue;
        sets.push(`${col} = $${i++}` + (k === 'result' ? '::JSONB' : ''));
        vals.push(k === 'result' ? JSON.stringify(v) : v);
      }
      if (sets.length === 0) return;
      vals.push(run_id, custom_id);
      await pool.query(
        `UPDATE batch_jobs SET ${sets.join(', ')} WHERE run_id = $${i} AND custom_id = $${i + 1}`,
        vals,
      );
    },

    async acquireLock(run_id) {
      const pool = getPool();
      if (!pool) return true; // DB-less: pretend we got it; orchestrator no-ops elsewhere
      if (lockClients.has(run_id)) return false; // already held in this process
      const client = await pool.connect();
      try {
        const r = await client.query<{ ok: boolean }>(
          `SELECT pg_try_advisory_lock($1::BIGINT) AS ok`,
          [lockKeyFor(run_id).toString()],
        );
        if (r.rows[0]?.ok) {
          lockClients.set(run_id, client);
          return true;
        }
        client.release();
        return false;
      } catch (err) {
        client.release();
        throw err;
      }
    },

    async releaseLock(run_id) {
      const client = lockClients.get(run_id);
      if (!client) return;
      try {
        await client.query(
          `SELECT pg_advisory_unlock($1::BIGINT)`,
          [lockKeyFor(run_id).toString()],
        );
      } finally {
        client.release();
        lockClients.delete(run_id);
      }
    },

    async listInFlightRuns() {
      const pool = getPool();
      if (!pool) return [];
      const r = await pool.query<RunRowDb>(
        `SELECT id, exam_pack_id, batch_provider, batch_id, batch_state, jsonl_path,
                budget_locked_usd::FLOAT8, COALESCE((config->>'budget_remaining_usd')::FLOAT8, 100) AS budget_remaining_usd,
                submitted_at::TEXT, last_polled_at::TEXT, error
           FROM generation_runs
           WHERE batch_state IN ('queued','prepared','submitted','downloading','processing')
           ORDER BY submitted_at NULLS FIRST`,
      );
      return r.rows.map(mapRun);
    },
  };
}

// ----------------------------------------------------------------------------
// Column mapping + row mapping
// ----------------------------------------------------------------------------

const COLUMN_MAP: Record<string, string> = {
  batch_provider: 'batch_provider',
  batch_id: 'batch_id',
  batch_state: 'batch_state',
  jsonl_path: 'jsonl_path',
  budget_locked_usd: 'budget_locked_usd',
  submitted_at: 'submitted_at',
  last_polled_at: 'last_polled_at',
  error: 'error',
};

const JOB_COLUMN_MAP: Record<string, string> = {
  status: 'status',
  result: 'result',
  error: 'error',
  submitted_at: 'submitted_at',
  processed_at: 'processed_at',
};

interface RunRowDb {
  id: string;
  exam_pack_id: string;
  batch_provider: string | null;
  batch_id: string | null;
  batch_state: string | null;
  jsonl_path: string | null;
  budget_locked_usd: number | null;
  budget_remaining_usd: number;
  submitted_at: string | null;
  last_polled_at: string | null;
  error: string | null;
}

function mapRun(r: RunRowDb): RunRow {
  return {
    id: r.id,
    exam_pack_id: r.exam_pack_id,
    batch_provider: (r.batch_provider as BatchProvider | null),
    batch_id: r.batch_id,
    batch_state: (r.batch_state as BatchState | null),
    jsonl_path: r.jsonl_path,
    budget_locked_usd: r.budget_locked_usd,
    budget_remaining_usd: r.budget_remaining_usd,
    submitted_at: r.submitted_at,
    last_polled_at: r.last_polled_at,
    error: r.error,
  };
}

interface JobRowDb {
  run_id: string;
  custom_id: string;
  atom_spec: AtomSpec;
  status: string;
  result: unknown;
  error: string | null;
  submitted_at: string | null;
  processed_at: string | null;
}

function mapJob(r: JobRowDb): JobRow {
  return {
    run_id: r.run_id,
    custom_id: r.custom_id,
    atom_spec: r.atom_spec,
    status: r.status as JobRow['status'],
    result: r.result,
    error: r.error,
    submitted_at: r.submitted_at,
    processed_at: r.processed_at,
  };
}

export const __testing = { lockKeyFor };
