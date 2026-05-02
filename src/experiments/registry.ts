/**
 * src/experiments/registry.ts
 *
 * CRUD for the experiments + experiment_assignments tables.
 *
 * Conventions:
 *   - Experiment IDs are caller-provided (slugged, deterministic) so the
 *     same hypothesis run twice doesn't create duplicate rows. Use
 *     generateExperimentId() for a default 'exp_<yyyymmdd-hhmm>_<slug>' shape.
 *   - All functions are no-ops (return null/empty/false) when DATABASE_URL
 *     is unset, so DB-less demos and tests work without mocks.
 *   - assignTarget is upsert-style: re-assigning the same (experiment, kind,
 *     target) is idempotent.
 */

import { execSync } from 'child_process';
import { getExperimentsPool } from './db';
import type {
  ExperimentRow,
  ExperimentAssignment,
  ExperimentStatus,
  VariantKind,
  AssignmentTargetKind,
} from './types';

// ============================================================================
// Helpers
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

export function generateExperimentId(slug?: string): string {
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 13);
  const safeSlug = (slug ?? 'exp')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `exp_${ts}_${safeSlug}`;
}

// ============================================================================
// Create / Read / Update
// ============================================================================

export interface CreateExperimentInput {
  id?: string;
  name: string;
  exam_pack_id: string;
  hypothesis?: string;
  variant_kind?: VariantKind;
  metadata?: Record<string, unknown>;
}

export async function createExperiment(
  input: CreateExperimentInput,
): Promise<ExperimentRow | null> {
  const pool = getExperimentsPool();
  if (!pool) return null;

  const id = input.id ?? generateExperimentId(input.name);
  const sha = currentGitSha();

  const { rows } = await pool.query<ExperimentRow>(
    `INSERT INTO experiments (id, name, exam_pack_id, git_sha, hypothesis, variant_kind, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
    [
      id,
      input.name,
      input.exam_pack_id,
      sha,
      input.hypothesis ?? null,
      input.variant_kind ?? null,
      input.metadata ?? {},
    ],
  );

  if (rows.length > 0) return rows[0];

  // Already existed — return it
  return getExperiment(id);
}

export async function getExperiment(id: string): Promise<ExperimentRow | null> {
  const pool = getExperimentsPool();
  if (!pool) return null;
  const { rows } = await pool.query<ExperimentRow>(
    `SELECT * FROM experiments WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export interface ListExperimentsFilter {
  exam_pack_id?: string;
  status?: ExperimentStatus;
  limit?: number;
}

export async function listExperiments(
  filter: ListExperimentsFilter = {},
): Promise<ExperimentRow[]> {
  const pool = getExperimentsPool();
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
  const limit = Math.min(filter.limit ?? 100, 500);

  const { rows } = await pool.query<ExperimentRow>(
    `SELECT * FROM experiments ${whereSql}
     ORDER BY started_at DESC
     LIMIT ${limit}`,
    args,
  );
  return rows;
}

export async function updateExperimentStatus(
  id: string,
  status: ExperimentStatus,
): Promise<boolean> {
  const pool = getExperimentsPool();
  if (!pool) return false;
  const ended = status !== 'active' ? 'NOW()' : 'NULL';
  const { rowCount } = await pool.query(
    `UPDATE experiments
       SET status = $2,
           ended_at = ${ended}
     WHERE id = $1`,
    [id, status],
  );
  return (rowCount ?? 0) > 0;
}

export async function updateExperimentLift(
  id: string,
  lift: number,
  n: number,
  p: number,
): Promise<boolean> {
  const pool = getExperimentsPool();
  if (!pool) return false;
  const { rowCount } = await pool.query(
    `UPDATE experiments
       SET lift_v1 = $2,
           lift_n = $3,
           lift_p = $4,
           lift_updated_at = NOW()
     WHERE id = $1`,
    [id, lift, n, p],
  );
  return (rowCount ?? 0) > 0;
}

// ============================================================================
// Assignments
// ============================================================================

export async function assignTarget(
  experimentId: string,
  kind: AssignmentTargetKind,
  targetId: string,
  variant: string,
): Promise<boolean> {
  const pool = getExperimentsPool();
  if (!pool) return false;
  const { rowCount } = await pool.query(
    `INSERT INTO experiment_assignments (experiment_id, target_kind, target_id, variant)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (experiment_id, target_kind, target_id) DO UPDATE
       SET variant = EXCLUDED.variant`,
    [experimentId, kind, targetId, variant],
  );
  return (rowCount ?? 0) > 0;
}

export async function getAssignments(
  experimentId: string,
  kind?: AssignmentTargetKind,
): Promise<ExperimentAssignment[]> {
  const pool = getExperimentsPool();
  if (!pool) return [];
  const args: unknown[] = [experimentId];
  let where = `experiment_id = $1`;
  if (kind) {
    args.push(kind);
    where += ` AND target_kind = $2`;
  }
  const { rows } = await pool.query<ExperimentAssignment>(
    `SELECT * FROM experiment_assignments WHERE ${where}`,
    args,
  );
  return rows;
}

/**
 * Lookup which experiment + variant a given target was assigned to.
 * Returns the most-recent assignment if multiple (shouldn't happen given
 * the PK, but defensive).
 */
export async function getAssignmentForTarget(
  kind: AssignmentTargetKind,
  targetId: string,
): Promise<ExperimentAssignment | null> {
  const pool = getExperimentsPool();
  if (!pool) return null;
  const { rows } = await pool.query<ExperimentAssignment>(
    `SELECT * FROM experiment_assignments
      WHERE target_kind = $1 AND target_id = $2
      ORDER BY assigned_at DESC
      LIMIT 1`,
    [kind, targetId],
  );
  return rows[0] ?? null;
}
