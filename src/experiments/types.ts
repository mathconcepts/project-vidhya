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
    /**
     * Phase 2 of Curriculum R&D — when present, the run dispatches into
     * the curriculum-unit-orchestrator instead of the atom-only flywheel.
     * Each spec produces one curriculum_unit + 5-15 child atoms.
     */
    curriculum_unit_specs?: Array<{
      id?: string;
      exam_pack_id: string;
      concept_id: string;
      name: string;
      hypothesis?: string;
      learning_objectives: Array<{ id: string; statement: string; blooms_level?: string }>;
      prepared_for_pyq_ids: string[];
      atom_kinds: string[];
      retrieval_days?: number[];
    }>;
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

/**
 * Phase 2 of Curriculum R&D — direct measurement of "did the experiment
 * make students better at the actual exam questions?". Uses the holdout
 * PYQ bank (pyq_questions WHERE is_holdout = TRUE) so practice runs don't
 * pollute the measurement.
 *
 * This is the lagging metric (north-star). lift_v1 (mastery delta) is the
 * leading metric. Both are tracked; the learnings ledger keys promotions
 * off whichever is stricter when both are available.
 */
export interface PyqAccuracyDeltaResult {
  experiment_id: string;
  /** Treatment minus control accuracy on the holdout bank, in [-1, 1]. */
  delta: number;
  n_treatment_attempts: number;
  n_control_attempts: number;
  /** P-value from a 2-proportion z-test (normal approximation). */
  p_value: number;
  computed_at: string;
  /** Raw accuracy figures, useful for debugging. */
  accuracy_treatment: number;
  accuracy_control: number;
  /** How many holdout PYQs in the exam pack were touched by either cohort. */
  holdout_pyqs_observed: number;
}
