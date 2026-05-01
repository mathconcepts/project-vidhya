// @ts-nocheck
/**
 * cohort-aggregator — nightly job that rolls up atom_engagements into
 * cohort_signals so common_traps cards can render "X% of students miss
 * this on the practice problem" callouts.
 *
 * Schedule: daily, wired in src/jobs/scheduler.ts.
 * Idempotent: upserts on atom_id, safe to re-run.
 *
 * Algorithm:
 *   SELECT atom_id,
 *          SUM(CASE WHEN last_recall_correct = false THEN 1 ELSE 0 END) AS errors,
 *          SUM(CASE WHEN last_recall_correct = true  THEN 1 ELSE 0 END) AS corrects,
 *          COUNT(*) AS n_seen
 *   FROM atom_engagements
 *   WHERE last_recall_correct IS NOT NULL
 *   GROUP BY atom_id;
 *
 * Then upsert (atom_id, error_pct, n_seen, computed_at).
 *
 * Only atoms where last_recall_correct IS NOT NULL contribute. Common_traps
 * atoms point at a related micro_exercise via tested_by_atom — the LessonPage
 * looks up cohort_signals for that linked atom_id, not for the trap itself.
 */

import pg from 'pg';

const { Pool } = pg;
let _pool: any = null;
function getPool() {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return _pool;
}

export interface CohortAggregateResult {
  atoms_processed: number;
  rows_upserted: number;
  duration_ms: number;
}

export async function runCohortAggregator(): Promise<CohortAggregateResult> {
  const start = Date.now();
  const pool = getPool();
  if (!pool) {
    return { atoms_processed: 0, rows_upserted: 0, duration_ms: 0 };
  }

  const aggregateSql = `
    SELECT atom_id,
           SUM(CASE WHEN last_recall_correct = false THEN 1 ELSE 0 END)::int AS errors,
           SUM(CASE WHEN last_recall_correct = true  THEN 1 ELSE 0 END)::int AS corrects
    FROM atom_engagements
    WHERE last_recall_correct IS NOT NULL
    GROUP BY atom_id
  `;
  const result = await pool.query(aggregateSql);
  let upserts = 0;

  for (const row of result.rows) {
    const errors = Number(row.errors) || 0;
    const corrects = Number(row.corrects) || 0;
    const n_seen = errors + corrects;
    if (n_seen === 0) continue;
    const error_pct = errors / n_seen;
    await pool.query(
      `INSERT INTO cohort_signals (atom_id, error_pct, n_seen, computed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (atom_id) DO UPDATE
         SET error_pct = EXCLUDED.error_pct,
             n_seen = EXCLUDED.n_seen,
             computed_at = NOW()`,
      [row.atom_id, error_pct.toFixed(3), n_seen],
    );
    upserts++;
  }

  return {
    atoms_processed: result.rows.length,
    rows_upserted: upserts,
    duration_ms: Date.now() - start,
  };
}
