/**
 * src/generation/run-orchestrator.ts
 *
 * Wraps the existing content-flywheel + concept-orchestrator with the
 * GenerationRun lifecycle:
 *
 *   queued → running → complete | aborted | failed
 *
 * The orchestrator does NOT replace the underlying generators — it wraps
 * them. Each call site (content-flywheel.ts, concept-orchestrator) gets a
 * `generation_run_id` that it stamps onto the rows it inserts. A single
 * run can produce many atoms / problems / media artifacts.
 *
 * Lifecycle is durable: status is persisted at every transition so a
 * crashed process can be debugged from the DB. cost_usd is updated as
 * the cost-meter accumulates.
 *
 * Auto-creates an experiment row when the operator launches a run via the
 * admin API — Sprint B will surface that. This module only owns the run.
 */

import { execSync } from 'child_process';
import { getGenerationPool } from './db';
import {
  createExperiment,
  generateExperimentId,
} from '../experiments/registry';
import type {
  GenerationRunRow,
  GenerationRunStatus,
  GenerationRunConfig,
} from '../experiments/types';

// ============================================================================
// ID + git helpers
// ============================================================================

let _cachedSha: string | null = null;
function currentGitSha(): string {
  if (_cachedSha) return _cachedSha;
  try {
    _cachedSha = execSync('git rev-parse HEAD', {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    _cachedSha = process.env.GIT_SHA ?? 'unknown';
  }
  return _cachedSha;
}

function generateRunId(): string {
  const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 6);
  return `run_${ts}_${rand}`;
}

// ============================================================================
// CRUD
// ============================================================================

export interface CreateRunInput {
  exam_pack_id: string;
  config: GenerationRunConfig;
  hypothesis?: string;
  /** If set, attach to an existing experiment. Otherwise auto-creates one. */
  experiment_id?: string;
  /** If true and experiment_id is null, auto-create a wrapping experiment. */
  auto_experiment?: boolean;
  id?: string;
}

export async function createRun(
  input: CreateRunInput,
): Promise<GenerationRunRow | null> {
  const pool = getGenerationPool();
  if (!pool) return null;

  const id = input.id ?? generateRunId();
  const sha = currentGitSha();

  // Auto-create wrapping experiment unless the operator opted out or supplied one.
  let experimentId = input.experiment_id ?? null;
  if (!experimentId && input.auto_experiment !== false) {
    const exp = await createExperiment({
      id: generateExperimentId(`run-${id}`),
      name: input.hypothesis?.slice(0, 80) ?? `Run ${id}`,
      exam_pack_id: input.exam_pack_id,
      hypothesis: input.hypothesis,
      variant_kind: 'gen_run',
      metadata: { run_id: id },
    });
    if (exp) experimentId = exp.id;
  }

  const { rows } = await pool.query<GenerationRunRow>(
    `INSERT INTO generation_runs
       (id, exam_pack_id, experiment_id, hypothesis, config, git_sha, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'queued')
     RETURNING *`,
    [
      id,
      input.exam_pack_id,
      experimentId,
      input.hypothesis ?? null,
      JSON.stringify(input.config),
      sha,
    ],
  );

  return rows[0] ?? null;
}

export async function getRun(id: string): Promise<GenerationRunRow | null> {
  const pool = getGenerationPool();
  if (!pool) return null;
  const { rows } = await pool.query<GenerationRunRow>(
    `SELECT * FROM generation_runs WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function listRuns(filter: {
  exam_pack_id?: string;
  status?: GenerationRunStatus;
  limit?: number;
} = {}): Promise<GenerationRunRow[]> {
  const pool = getGenerationPool();
  if (!pool) return [];
  const wheres: string[] = [];
  const args: unknown[] = [];
  if (filter.exam_pack_id) {
    args.push(filter.exam_pack_id);
    wheres.push(`exam_pack_id = $${args.length}`);
  }
  if (filter.status) {
    args.push(filter.status);
    wheres.push(`status = $${args.length}`);
  }
  const whereSql = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';
  const limit = Math.min(filter.limit ?? 50, 200);
  const { rows } = await pool.query<GenerationRunRow>(
    `SELECT * FROM generation_runs ${whereSql}
     ORDER BY created_at DESC
     LIMIT ${limit}`,
    args,
  );
  return rows;
}

// ============================================================================
// Lifecycle transitions
// ============================================================================

export async function markRunStarted(id: string): Promise<void> {
  const pool = getGenerationPool();
  if (!pool) return;
  await pool.query(
    `UPDATE generation_runs
        SET status = 'running', started_at = NOW()
      WHERE id = $1 AND status = 'queued'`,
    [id],
  );
}

export async function updateRunCost(id: string, costUsd: number): Promise<void> {
  const pool = getGenerationPool();
  if (!pool) return;
  await pool.query(
    `UPDATE generation_runs SET cost_usd = $2 WHERE id = $1`,
    [id, costUsd],
  );
}

export async function incrementRunArtifacts(
  id: string,
  delta = 1,
): Promise<void> {
  const pool = getGenerationPool();
  if (!pool) return;
  await pool.query(
    `UPDATE generation_runs SET artifacts_count = artifacts_count + $2 WHERE id = $1`,
    [id, delta],
  );
}

export async function markRunComplete(
  id: string,
  finalCostUsd?: number,
): Promise<void> {
  const pool = getGenerationPool();
  if (!pool) return;
  if (finalCostUsd != null) {
    await pool.query(
      `UPDATE generation_runs
          SET status = 'complete',
              completed_at = NOW(),
              cost_usd = $2
        WHERE id = $1`,
      [id, finalCostUsd],
    );
  } else {
    await pool.query(
      `UPDATE generation_runs
          SET status = 'complete',
              completed_at = NOW()
        WHERE id = $1`,
      [id],
    );
  }
}

export async function markRunFailed(
  id: string,
  error: string,
  status: 'failed' | 'aborted' = 'failed',
): Promise<void> {
  const pool = getGenerationPool();
  if (!pool) return;
  await pool.query(
    `UPDATE generation_runs
        SET status = $3,
            completed_at = NOW(),
            error = $2
      WHERE id = $1`,
    [id, error.slice(0, 4000), status],
  );
}
