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

import { getCohortSignalsRepo } from '../storage/repositories/cohort-signals-repo';

export interface CohortAggregateResult {
  atoms_processed: number;
  rows_upserted: number;
  duration_ms: number;
}

export async function runCohortAggregator(): Promise<CohortAggregateResult> {
  const start = Date.now();
  const repo = getCohortSignalsRepo();
  const aggregates = await repo.getEngagementAggregates();
  let upserts = 0;

  for (const row of aggregates) {
    const n_seen = row.errors + row.corrects;
    if (n_seen === 0) continue;
    const error_pct = row.errors / n_seen;
    await repo.upsertSignal(row.atom_id, error_pct, n_seen);
    upserts++;
  }

  return {
    atoms_processed: aggregates.length,
    rows_upserted: upserts,
    duration_ms: Date.now() - start,
  };
}
