/**
 * src/experiments/types.ts
 *
 * Shared types for the experiment spine. Mirrors the schema in
 * supabase/migrations/020_experiments.sql.
 */

export type ExperimentStatus =
  | 'active'
  | 'won'
  | 'lost'
  | 'inconclusive'
  | 'aborted';

export type VariantKind = 'atom' | 'flag' | 'gen_run' | 'multi';

export type AssignmentTargetKind = 'atom' | 'flag' | 'gen_run' | 'session';

export type SnapshotSource = 'attempt' | 'nightly' | 'backfill';

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

export interface ExperimentAssignment {
  experiment_id: string;
  target_kind: AssignmentTargetKind;
  target_id: string;
  variant: string;
  assigned_at: string;
}

export interface MasterySnapshot {
  session_id: string;
  user_id: string | null;
  concept_id: string;
  exam_pack_id: string;
  mastery: number;
  attempts: number;
  taken_at: string;
  source: SnapshotSource;
}

export interface GenerationRunRow {
  id: string;
  exam_pack_id: string;
  experiment_id: string | null;
  hypothesis: string | null;
  config: GenerationRunConfig;
  git_sha: string;
  status: GenerationRunStatus;
  cost_usd: number;
  artifacts_count: number;
  error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

/**
 * Operator-controlled config for one generation run. Every knob that
 * matters for measurement (target population, pipeline shape, verification
 * tier, $ cap) is captured here so the experiment is reproducible.
 */
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

export interface LiftResult {
  experiment_id: string;
  lift: number; // mean mastery delta, treatment minus control
  n_treatment: number;
  n_control: number;
  p_value: number;
  computed_at: string;
  window_days: number;
  /** Raw means, useful for debugging */
  mean_treatment: number;
  mean_control: number;
}
