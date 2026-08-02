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
  /** Top-3 most frequent diagnosis values for a concept in the last 30 days. */
  getTopMisconceptions(conceptId: string): Promise<string[]>;
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

  async getTopMisconceptions(conceptId: string): Promise<string[]> {
    // FIXED (was: KNOWN PRE-EXISTING BUG, flagged in the Phase 0 delivery
    // doc as lower-urgency than retention-engine.ts's bug but "worth a
    // look in the same pass"). `error_log`
    // (migration 011_gbrain_cognitive_architecture.sql) has never had an
    // `atom_id` or `error_text` column — it's keyed by `concept_id` +
    // `problem_id`, with the human-readable text in `diagnosis`. The old
    // query against `atom_id`/`error_text` always threw, was always caught
    // by fetchTopMisconceptions()'s try/catch in src/jobs/regen-scanner.ts,
    // and always silently returned `[]` — the "generate the new atom
    // knowing exactly what students get wrong" feature never actually ran.
    //
    // Fix: group by the coarser `concept_id` instead of `atom_id` (many
    // atoms share a concept_id — this is a real, accepted precision loss,
    // not a workaround) and select `diagnosis` instead of the nonexistent
    // `error_text`. The call site (src/jobs/regen-scanner.ts) already
    // derives `concept_id` from the atom_id via parseAtomId() for its own
    // generateConcept() call, so this repo now takes conceptId directly —
    // no new join or lookup needed.
    const { rows } = await this.pool.query<{ diagnosis: string; freq: string }>(
      `SELECT diagnosis, COUNT(*) AS freq
         FROM error_log
         WHERE concept_id = $1
           AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY diagnosis
         ORDER BY freq DESC
         LIMIT 3`,
      [conceptId],
    );
    return rows.map((row) => row.diagnosis).filter(Boolean);
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
