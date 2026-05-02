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

export interface CurriculumUnitSpec {
  id?: string;
  exam_pack_id: string;
  concept_id: string;
  name: string;
  hypothesis?: string;
  learning_objectives: Array<{ id: string; statement: string; blooms_level?: string }>;
  prepared_for_pyq_ids: string[];
  atom_kinds: string[];
  retrieval_days?: number[];
}

export interface GenerationRunConfig {
  target: {
    topic_id?: string;
    concept_ids?: string[];
    difficulty_dist?: { easy: number; medium: number; hard: number };
    /** Phase 2 of Curriculum R&D — when present, the run produces curriculum_units, not raw atoms. */
    curriculum_unit_specs?: CurriculumUnitSpec[];
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

// ============================================================================
// Sprint C: Ledger + Suggestions
// ============================================================================

export interface LedgerRunRow {
  id: string;
  ran_at: string;
  experiments_evaluated: number;
  promotions: number;
  demotions: number;
  suggestions: number;
  pr_url: string | null;
  status: 'running' | 'complete' | 'failed' | 'dry_run';
}

export interface RunSuggestionRow {
  id: string;
  exam_pack_id: string;
  source_experiment_id: string | null;
  hypothesis: string;
  config: GenerationRunConfig;
  reason: string;
  expected_lift: number | null;
  expected_n: number | null;
  status: 'pending' | 'launched' | 'dismissed';
  created_at: string;
  acted_at: string | null;
}

export async function listLedgerRuns(limit = 20): Promise<{ runs: LedgerRunRow[]; count: number }> {
  return jsonOrThrow(await authFetch(`/api/admin/ledger/runs?limit=${limit}`));
}

export async function runLedgerNow(opts: { force_pr?: boolean; no_pr?: boolean } = {}): Promise<{ result: unknown }> {
  return jsonOrThrow(
    await authFetch('/api/admin/ledger/run-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    }),
  );
}

export async function listSuggestions(filter: { exam?: string; status?: string } = {}): Promise<{ suggestions: RunSuggestionRow[]; count: number }> {
  const qs = new URLSearchParams();
  if (filter.exam) qs.set('exam', filter.exam);
  if (filter.status) qs.set('status', filter.status);
  const path = `/api/admin/suggestions${qs.toString() ? `?${qs}` : ''}`;
  return jsonOrThrow(await authFetch(path));
}

// ============================================================================
// Curriculum R&D Phase 3 — holdout dashboard
// ============================================================================

export interface HoldoutSummary {
  exam_pack_id: string;
  total_holdout: number;
  stratification: Array<{ year: number; topic: string; count: number }>;
  timeline_28d: Array<{ day: string; attempts: number; correct: number; accuracy: number }>;
}

export interface HoldoutPyqRow {
  id: string;
  year: number;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  taught_by_unit_id: string | null;
  attempts: number;
  correct: number;
  accuracy: number | null;
}

export async function getHoldoutSummary(exam: string): Promise<HoldoutSummary> {
  return jsonOrThrow(await authFetch(`/api/admin/holdout/summary?exam=${encodeURIComponent(exam)}`));
}

export async function listHoldoutPyqs(exam: string): Promise<{ exam_pack_id: string; count: number; pyqs: HoldoutPyqRow[] }> {
  return jsonOrThrow(await authFetch(`/api/admin/holdout/pyqs?exam=${encodeURIComponent(exam)}`));
}

/**
 * The Phase 2 dual-metric lift result, persisted into experiments.metadata
 * by the nightly learnings-ledger. Frontend reads it from
 * `experiment.metadata.pyq_accuracy_delta_v1` (the listExperiments
 * endpoint already SELECTs *, so the field is wired without a backend
 * change).
 */
export interface PyqAccuracyDeltaResult {
  experiment_id: string;
  delta: number;
  n_treatment_attempts: number;
  n_control_attempts: number;
  p_value: number;
  computed_at: string;
  accuracy_treatment: number;
  accuracy_control: number;
  holdout_pyqs_observed: number;
}

export async function actOnSuggestion(id: string, action: 'launch' | 'dismiss'): Promise<{ ok: boolean; run?: GenerationRunRow }> {
  return jsonOrThrow(
    await authFetch(`/api/admin/suggestions/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }),
  );
}

export { AdminApiError };
