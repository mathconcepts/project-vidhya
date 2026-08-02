/**
 * LearningsLedgerRepo — storage boundary for src/jobs/learnings-ledger.ts
 * (CEO plan Phase 0, §5 / §5.1 "generation + jobs modules import zero pg").
 *
 * Same split as the other job repos: the job file keeps orchestration (the
 * promote/demote decision logic, digest markdown, the optional `gh pr
 * create` step); this repo owns the seven raw queries against
 * experiment_assignments, atom_versions, media_artifacts,
 * generated_problems, generation_runs, run_suggestions, and ledger_runs.
 *
 * `listExperiments`/`updateExperimentStatus`/`computeLift` (from
 * src/experiments/registry.ts and src/experiments/lift.ts) are untouched —
 * those go through src/experiments/db.ts's own pool, a separate file still
 * on the pg-allowlist and out of scope for this migration.
 *
 * No File implementation: promotion/demotion decisions and the operator
 * suggestion inbox only mean anything against the real experiment tables —
 * same reasoning as ContentFlywheelRepo. The factory returns `null` when
 * DATABASE_URL is unset; runLearningsLedger() already short-circuits to a
 * zeroed LedgerRunResult in that case (unchanged from before this move).
 */

import type { Pool } from 'pg';
import { getSharedPool } from '../pool';

export interface RunConfigRow {
  experiment_id: string;
  config: unknown;
}

export interface SuggestionInsert {
  id: string;
  exam_pack_id: string;
  source_experiment_id: string;
  hypothesis: string;
  config: unknown;
  reason: string;
  expected_lift: number | null;
  expected_n: number | null;
}

export interface LedgerRunCompleteInput {
  id: string;
  experiments_evaluated: number;
  promotions: number;
  demotions: number;
  suggestions: number;
  pr_url: string | null;
  digest?: string;
}

export interface LearningsLedgerRepo {
  /** atom_id list assigned to an experiment with a non-control variant. */
  fetchAtomTargets(experimentId: string): Promise<string[]>;
  /** Flips atom_versions + media_artifacts + generated_problems to canonical=true for the winning targets. */
  applyPromotion(targets: string[], reason: string): Promise<void>;
  /** Flips media_artifacts.status='failed' and atom_versions.canonical=false for the losing targets. */
  applyDemotion(targets: string[], reason: string): Promise<void>;
  /** Most recent generation_runs.config per experiment id, for the suggester to scale/invert. */
  loadRecentRunConfigs(experimentIds: string[]): Promise<RunConfigRow[]>;
  upsertSuggestion(s: SuggestionInsert): Promise<void>;
  markLedgerRunRunning(id: string): Promise<void>;
  markLedgerRunComplete(input: LedgerRunCompleteInput): Promise<void>;
}

export class PgLearningsLedgerRepo implements LearningsLedgerRepo {
  constructor(private pool: Pool) {}

  async fetchAtomTargets(experimentId: string): Promise<string[]> {
    const { rows } = await this.pool.query<{ target_id: string }>(
      `SELECT target_id
         FROM experiment_assignments
        WHERE experiment_id = $1
          AND target_kind = 'atom'
          AND variant <> 'control'`,
      [experimentId],
    );
    return rows.map((r) => r.target_id);
  }

  async applyPromotion(targets: string[], reason: string): Promise<void> {
    if (targets.length === 0) return;

    await this.pool.query(
      `UPDATE atom_versions
         SET canonical = TRUE,
             canonical_at = NOW(),
             canonical_reason = $2
       WHERE atom_id = ANY($1::TEXT[])`,
      [targets, reason],
    );

    await this.pool.query(
      `UPDATE media_artifacts
         SET canonical = TRUE,
             canonical_at = NOW(),
             canonical_reason = $2
       WHERE atom_id = ANY($1::TEXT[]) AND status = 'done'`,
      [targets, reason],
    );

    // generated_problems uses `id`, not atom_id, but the experiment may
    // have assigned problem ids directly under the same target_kind=atom
    // bucket (we don't currently distinguish). Best-effort: try by id.
    await this.pool.query(
      `UPDATE generated_problems
         SET canonical = TRUE,
             canonical_at = NOW(),
             canonical_reason = $2
       WHERE id::TEXT = ANY($1::TEXT[]) AND verified = TRUE`,
      [targets, reason],
    );
  }

  async applyDemotion(targets: string[], reason: string): Promise<void> {
    if (targets.length === 0) return;

    // Flip media artifacts to 'failed' so applyMediaUrls skips them
    await this.pool.query(
      `UPDATE media_artifacts
         SET status = 'failed',
             canonical = FALSE,
             canonical_at = NOW(),
             canonical_reason = $2
       WHERE atom_id = ANY($1::TEXT[])`,
      [targets, reason],
    );

    // Mark atom_versions explicitly non-canonical (operator may regen)
    await this.pool.query(
      `UPDATE atom_versions
         SET canonical = FALSE,
             canonical_at = NOW(),
             canonical_reason = $2
       WHERE atom_id = ANY($1::TEXT[])`,
      [targets, reason],
    );
  }

  async loadRecentRunConfigs(experimentIds: string[]): Promise<RunConfigRow[]> {
    if (experimentIds.length === 0) return [];
    const { rows } = await this.pool.query<RunConfigRow>(
      `SELECT DISTINCT ON (experiment_id) experiment_id, config
         FROM generation_runs
        WHERE experiment_id = ANY($1::TEXT[])
        ORDER BY experiment_id, created_at DESC`,
      [experimentIds],
    );
    return rows;
  }

  async upsertSuggestion(s: SuggestionInsert): Promise<void> {
    await this.pool.query(
      `INSERT INTO run_suggestions (id, exam_pack_id, source_experiment_id, hypothesis, config, reason, expected_lift, expected_n)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         hypothesis = EXCLUDED.hypothesis,
         config     = EXCLUDED.config,
         reason     = EXCLUDED.reason,
         expected_lift = EXCLUDED.expected_lift,
         expected_n    = EXCLUDED.expected_n`,
      [
        s.id,
        s.exam_pack_id,
        s.source_experiment_id,
        s.hypothesis,
        JSON.stringify(s.config),
        s.reason,
        s.expected_lift,
        s.expected_n,
      ],
    );
  }

  async markLedgerRunRunning(id: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO ledger_runs (id, status) VALUES ($1, 'running')
       ON CONFLICT (id) DO NOTHING`,
      [id],
    );
  }

  async markLedgerRunComplete(input: LedgerRunCompleteInput): Promise<void> {
    await this.pool.query(
      `UPDATE ledger_runs
          SET experiments_evaluated = $2,
              promotions = $3,
              demotions = $4,
              suggestions = $5,
              pr_url = $6,
              digest_md = COALESCE($7, digest_md),
              status = 'complete'
        WHERE id = $1`,
      [
        input.id,
        input.experiments_evaluated,
        input.promotions,
        input.demotions,
        input.suggestions,
        input.pr_url,
        input.digest ?? null,
      ],
    );
  }
}

/** Test/reference only — never returned by the factory (runLearningsLedger() already short-circuits on a null repo). */
export class NullLearningsLedgerRepo implements LearningsLedgerRepo {
  async fetchAtomTargets(): Promise<string[]> {
    return [];
  }
  async applyPromotion(): Promise<void> {}
  async applyDemotion(): Promise<void> {}
  async loadRecentRunConfigs(): Promise<RunConfigRow[]> {
    return [];
  }
  async upsertSuggestion(): Promise<void> {}
  async markLedgerRunRunning(): Promise<void> {}
  async markLedgerRunComplete(): Promise<void> {}
}

/** Factory: Postgres-backed when DATABASE_URL is set, `null` otherwise (matches pre-migration DB-less behavior). */
export function getLearningsLedgerRepo(): LearningsLedgerRepo | null {
  const pool = getSharedPool();
  return pool ? new PgLearningsLedgerRepo(pool) : null;
}
