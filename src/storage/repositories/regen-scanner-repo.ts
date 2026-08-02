/**
 * RegenScannerRepo — storage boundary for src/jobs/regen-scanner.ts
 * (CEO plan Phase 0, §5 / §5.1 "generation + jobs modules import zero pg").
 *
 * The job file keeps the pipeline logic (freshness-gate decision,
 * atom_id parsing, the regen loop, A/B start decision); this repo owns
 * the five raw queries against cohort_signals, atom_versions, and
 * error_log.
 *
 * No File implementation — regen scanning only means anything against
 * real cohort/error data. The factory returns `null` when DATABASE_URL
 * is unset; runRegenScanner() already has its own DB-less early-return
 * (`status: 'skipped_no_db'`), so this mirrors that contract rather than
 * throwing.
 */

import type { Pool } from 'pg';
import { getSharedPool } from '../pool';

export interface CandidateRow {
  atom_id: string;
  error_pct: number | string;
  n_seen: number;
}

export interface RegenScannerRepo {
  /** Most recent cohort_signals.updated_at across all rows, or null if the table is empty. */
  getMaxCohortSignalUpdatedAt(): Promise<string | null>;
  /** Top-N atoms over the error/n_seen thresholds, excluding atoms regenerated within dedupeHours. */
  getCandidates(errorThreshold: number, minNSeen: number, dedupeHours: number, cap: number): Promise<CandidateRow[]>;
  /** Top-3 most frequent error_text values for an atom in the last 30 days. */
  getTopMisconceptions(atomId: string): Promise<string[]>;
  /** Up to the 2 most recent atom_versions.version_n for an atom, newest first. */
  getLatestTwoVersionNumbers(atomId: string): Promise<number[]>;
  /** Sets improvement_reason on the atom's newest version row. */
  updateImprovementReason(atomId: string, reason: string): Promise<void>;
}

export class PgRegenScannerRepo implements RegenScannerRepo {
  constructor(private pool: Pool) {}

  async getMaxCohortSignalUpdatedAt(): Promise<string | null> {
    // Pre-migration bug fix: cohort_signals (migration
    // 015_cohort_aggregator.sql or similar) has no `updated_at` column —
    // its only timestamp is `computed_at`. This query always threw, was
    // always caught by isCohortDataFresh()'s try/catch in
    // src/jobs/regen-scanner.ts, and always returned false — meaning the
    // freshness gate always treated cohort data as stale and the nightly
    // regen scanner always short-circuited to `status: 'skipped_stale'`
    // before examining a single candidate. Confirmed by live-DB smoke test
    // during this migration (2026-08-02). Unlike the error_log mismatch in
    // getTopMisconceptions, this one is an unambiguous rename — the table
    // has exactly one timestamp column — so it's fixed here.
    const { rows } = await this.pool.query<{ max_ts: string | null }>(
      `SELECT MAX(computed_at) AS max_ts FROM cohort_signals`,
    );
    return rows[0]?.max_ts ?? null;
  }

  async getCandidates(errorThreshold: number, minNSeen: number, dedupeHours: number, cap: number): Promise<CandidateRow[]> {
    const { rows } = await this.pool.query<CandidateRow>(
      `SELECT cs.atom_id, cs.error_pct, cs.n_seen
         FROM cohort_signals cs
         WHERE cs.error_pct > $1 AND cs.n_seen >= $2
           AND NOT EXISTS (
             SELECT 1 FROM atom_versions av
              WHERE av.atom_id = cs.atom_id
                AND av.generated_at > NOW() - ($3 || ' hours')::interval
           )
         ORDER BY cs.error_pct DESC, cs.n_seen DESC
         LIMIT $4`,
      [errorThreshold, minNSeen, String(dedupeHours), cap],
    );
    return rows;
  }

  async getTopMisconceptions(atomId: string): Promise<string[]> {
    // KNOWN PRE-EXISTING BUG, preserved verbatim (not fixed here — see note
    // below): `error_log` (migration 011_gbrain_cognitive_architecture.sql)
    // has never had an `atom_id` or `error_text` column. It's keyed by
    // `concept_id` + `problem_id`, with the human-readable text in
    // `diagnosis`. This query has always thrown against real Postgres,
    // always been caught by fetchTopMisconceptions()'s try/catch in
    // src/jobs/regen-scanner.ts, and always silently returned `[]` — the
    // nightly regen scanner's "generate the new atom knowing exactly what
    // students get wrong" misconception-context feature has never actually
    // run in any real deployment. Confirmed by live-DB smoke test during
    // this migration (2026-08-02).
    //
    // Not fixed as part of this migration: unlike the sr_sessions column
    // rename in content-prioritizer-repo.ts, there's no unambiguous
    // mechanical fix — `atom_id` isn't a column on error_log at all, only
    // `concept_id` (coarser: many atoms share a concept_id) and
    // `problem_id`. Picking the right grouping key + column is a product
    // decision, not a typo fix, so the original (broken) query is
    // preserved as-is per migration discipline: move the SQL to the
    // storage boundary without silently changing behavior.
    const { rows } = await this.pool.query<{ error_text: string; freq: string }>(
      `SELECT error_text, COUNT(*) AS freq
         FROM error_log
         WHERE atom_id = $1
           AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY error_text
         ORDER BY freq DESC
         LIMIT 3`,
      [atomId],
    );
    return rows.map((row) => row.error_text).filter(Boolean);
  }

  async getLatestTwoVersionNumbers(atomId: string): Promise<number[]> {
    const { rows } = await this.pool.query<{ version_n: number }>(
      `SELECT version_n FROM atom_versions WHERE atom_id = $1 ORDER BY version_n DESC LIMIT 2`,
      [atomId],
    );
    return rows.map((row) => row.version_n);
  }

  async updateImprovementReason(atomId: string, reason: string): Promise<void> {
    await this.pool.query(
      `UPDATE atom_versions
         SET improvement_reason = $1
         WHERE atom_id = $2
           AND version_n = (SELECT MAX(version_n) FROM atom_versions WHERE atom_id = $2)`,
      [reason, atomId],
    );
  }
}

/** Test/reference only — never returned by the factory. */
export class NullRegenScannerRepo implements RegenScannerRepo {
  async getMaxCohortSignalUpdatedAt(): Promise<string | null> {
    return null;
  }
  async getCandidates(): Promise<CandidateRow[]> {
    return [];
  }
  async getTopMisconceptions(): Promise<string[]> {
    return [];
  }
  async getLatestTwoVersionNumbers(): Promise<number[]> {
    return [];
  }
  async updateImprovementReason(): Promise<void> {}
}

/** Factory: Postgres-backed when DATABASE_URL is set, `null` otherwise. */
export function getRegenScannerRepo(): RegenScannerRepo | null {
  const pool = getSharedPool();
  return pool ? new PgRegenScannerRepo(pool) : null;
}
