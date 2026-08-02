/**
 * db-preflight — fast, short-timeout DATABASE_URL connectivity check.
 *
 * Every DB-touching module in this repo (atom-versions.ts, concept-cost.ts,
 * pyq-grounding.ts, and ~40 others) already degrades gracefully: each one
 * builds its own lazy `pg.Pool` and returns null / warns on query failure,
 * so an unset DATABASE_URL is already a fully supported, crash-free path.
 *
 * The gap this closes: DATABASE_URL *set* but pointing at a DB that
 * doesn't exist yet / isn't reachable (the exact corner case of "the user
 * asked for DB features but never ran `docker compose up` / created the
 * database"). Without this check, that failure mode isn't a crash — it's
 * worse for an unattended run: ~15 independent connection pools each
 * retry their own OS-level TCP connect timeout, on first use, once per
 * concept, silently adding minutes of dead time across an 80+ concept run
 * with no single clear diagnostic pointing at the cause.
 *
 * preflightDatabase() is a PURE check — safe to call from anywhere,
 * including the shared job-runner preflight (which may run inside the
 * long-lived server process via the admin job routes, where mutating
 * process.env.DATABASE_URL would break every other in-flight request).
 * Only the standalone CLI entrypoint (job-cli.ts — always a fresh,
 * one-shot process) additionally acts on a failed result by unsetting
 * DATABASE_URL for that process; see the comment there.
 */

import pg from 'pg';

export interface DbPreflightResult {
  ok: boolean;
  error?: string;
}

export async function preflightDatabase(): Promise<DbPreflightResult> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return { ok: true };

  const { Pool } = pg;
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
