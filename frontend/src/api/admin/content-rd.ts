/**
 * frontend/src/api/admin/content-rd.ts
 *
 * Typed client for the Sprint B2 admin REST surface (experiments + runs).
 *
 * Auth: piggybacks on the Vidhya JWT in localStorage via authFetch.
 * The server's requireRole('admin') accepts the user's session token
 * directly — no embedded secrets.
 */

import { authFetch } from '@/lib/auth/client';

// ============================================================================
// Mirror types from src/experiments/types.ts (kept in sync manually for now;
// at scale we'd publish them via a shared package).
// ============================================================================

export type ExperimentStatus =
  | 'active'
  | 'won'
  | 'lost'
  | 'inconclusive'
  | 'aborted';

export type VariantKind = 'atom' | 'flag' | 'gen_run' | 'multi';

export type GenerationRunStatus =
  | 'queued'
  | 'running'
  | 'complete'
  | 'aborted'
  | 'failed';

export interface ExperimentRow {
  id: string;
  name: string;
  exam_pack_id: string;
  git_sha: string;
  hypothesis: string | null;
  variant_kind: VariantKind | null;
  started_at: string;
  ended_at: string | null;
  status: ExperimentStatus;
  lift_v1: number | null;
  lift_n: number | null;
  lift_p: number | null;
  lift_updated_at: string | null;
  metadata: Record<string, unknown>;
}

export interface GenerationRunConfig {
  target: {
    topic_id?: string;
    concept_ids?: string[];
    difficulty_dist?: { easy: number; medium: number; hard: number };
  };
  pipeline: {
    template_id?: string;
    llm_models?: string[];
    pyq_grounding?: boolean;
    multi_llm_consensus?: boolean;
  };
  verification: {
    tier_ceiling: 'rag' | 'gemini' | 'wolfram';
    gemini_dual_solve?: boolean;
    wolfram_required?: boolean;
  };
  pedagogy?: {
    reviewer_strictness?: 'lenient' | 'standard' | 'strict';
  };
  quota: {
    count: number;
    max_cost_usd: number;
    deadline_hours?: number;
  };
}

export interface GenerationRunRow {
  id: string;
  exam_pack_id: string;
  experiment_id: string | null;
  hypothesis: string | null;
  config: GenerationRunConfig;
  git_sha: string;
  status: GenerationRunStatus;
  cost_usd: number | string;
  artifacts_count: number;
  error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface CostEstimate {
  estimated_cost_usd: number;
  estimated_duration_minutes: number;
  per_artifact_usd: number;
  call_count: number;
  breakdown: { generation_usd: number; verification_usd: number };
  warnings: string[];
  from_heuristics: boolean;
}

export interface LiftResult {
  experiment_id: string;
  lift: number;
  n_treatment: number;
  n_control: number;
  p_value: number;
  computed_at: string;
  window_days: number;
  mean_treatment: number;
  mean_control: number;
}

// ============================================================================
// HTTP helpers
// ============================================================================

class AdminApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'AdminApiError';
  }
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = res.statusText || 'Request failed';
    try {
      const body = await res.json();
      msg = body.message || body.error || msg;
    } catch { /* swallow */ }
    throw new AdminApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

// ============================================================================
// Experiments
// ============================================================================

export async function listExperiments(filter: {
  exam?: string;
  status?: ExperimentStatus;
  limit?: number;
} = {}): Promise<{ experiments: ExperimentRow[]; count: number }> {
  const qs = new URLSearchParams();
  if (filter.exam) qs.set('exam', filter.exam);
  if (filter.status) qs.set('status', filter.status);
  if (filter.limit) qs.set('limit', String(filter.limit));
  const path = `/api/admin/experiments${qs.toString() ? `?${qs}` : ''}`;
  return jsonOrThrow(await authFetch(path));
}

export async function getExperiment(
  id: string,
): Promise<{ experiment: ExperimentRow; assignments: unknown[] }> {
  return jsonOrThrow(await authFetch(`/api/admin/experiments/${encodeURIComponent(id)}`));
}

export async function createExperiment(input: {
  name: string;
  exam_pack_id: string;
  hypothesis?: string;
  variant_kind?: VariantKind;
}): Promise<{ experiment: ExperimentRow }> {
  return jsonOrThrow(
    await authFetch('/api/admin/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateExperimentStatus(
  id: string,
  status: ExperimentStatus,
): Promise<{ ok: boolean }> {
  return jsonOrThrow(
    await authFetch(`/api/admin/experiments/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),
  );
}

export async function recomputeLift(
  id: string,
  windowDays = 7,
): Promise<{ result: LiftResult }> {
  return jsonOrThrow(
    await authFetch(
      `/api/admin/experiments/${encodeURIComponent(id)}/recompute-lift`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ window_days: windowDays }),
      },
    ),
  );
}

// ============================================================================
// Runs
// ============================================================================

export async function listRuns(filter: {
  exam?: string;
  status?: GenerationRunStatus;
  limit?: number;
} = {}): Promise<{ runs: GenerationRunRow[]; count: number }> {
  const qs = new URLSearchParams();
  if (filter.exam) qs.set('exam', filter.exam);
  if (filter.status) qs.set('status', filter.status);
  if (filter.limit) qs.set('limit', String(filter.limit));
  const path = `/api/admin/runs${qs.toString() ? `?${qs}` : ''}`;
  return jsonOrThrow(await authFetch(path));
}

export async function dryRun(input: {
  config: GenerationRunConfig;
}): Promise<{ estimate: CostEstimate }> {
  return jsonOrThrow(
    await authFetch('/api/admin/runs/dry-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function createRun(input: {
  exam_pack_id: string;
  config: GenerationRunConfig;
  hypothesis?: string;
  experiment_id?: string;
  auto_experiment?: boolean;
}): Promise<{ run: GenerationRunRow }> {
  return jsonOrThrow(
    await authFetch('/api/admin/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function abortRun(
  id: string,
  reason?: string,
): Promise<{ ok: boolean }> {
  return jsonOrThrow(
    await authFetch(`/api/admin/runs/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'abort', reason }),
    }),
  );
}

export { AdminApiError };
