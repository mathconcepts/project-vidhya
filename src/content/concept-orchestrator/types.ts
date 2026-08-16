/**
 * types.ts — shared types for the Concept Generation Framework v1.
 */

import type { AtomType, BloomLevel } from '../content-types';

/**
 * Source identifier for the cascade. 'llm-claude'/'llm-gemini' are
 * historical labels for "primary generation leg" / "secondary consensus
 * leg" — since multi-provider support landed, either leg can be backed by
 * any configured provider's model (see OrchestratorOptions.model_id), not
 * literally Claude/Gemini. Kept as-is to avoid a wider rename; treat them
 * as positional labels, not provider identity.
 */
export type GenerationSource = 'wolfram' | 'llm-claude' | 'llm-gemini' | 'url-extract' | 'uploads';

export interface GenerationMeta {
  source_cascade: GenerationSource[];
  wolfram_grounded: boolean;
  llm_consensus?: boolean;     // math atoms only
  llm_judge_score?: number;    // 0-10
  template?: string;           // "calculus.intuition"
  pyq_grounded: string[];      // PYQ ids used for grounding
  generated_at: string;        // ISO 8601
  cost_usd: number;
  prior_version?: number;      // version_n of the version this replaced
  improvement_reason?: string; // human-readable why-better diff
  /** Set when LLM-judge auto-rejected. */
  auto_rejected?: { score: number; reason: string };
  /** Set when math atoms went via consensus path. */
  consensus_disagreement?: { models: string[]; reason: string };
  /**
   * CAS pre-verification result (controlled by VIDHYA_CAS_PREFLIGHT env).
   *   null  = skipped (no extractable answer, or gate is off)
   *   true  = Wolfram confirmed the stated answer
   *   false = Wolfram disagreed (atom may have been rejected in gate mode)
   */
  cas_pre_verified?: boolean | null;
}

export interface GeneratedAtom {
  /** Stable atom_id (e.g. "derivatives-basic.intuition"). */
  atom_id: string;
  concept_id: string;
  atom_type: AtomType;
  bloom_level: BloomLevel;
  difficulty: number;
  exam_ids: string[];
  /** Markdown body. */
  content: string;
  meta: GenerationMeta;
}

export interface ConceptDraft {
  concept_id: string;
  lo_id?: string;
  topic_family: string;
  generated_at: string;
  total_cost_usd: number;
  atoms: GeneratedAtom[];
  /** Atoms auto-rejected by LLM-judge. Surfaced to admin for context. */
  rejected_atoms: GeneratedAtom[];
}

export interface OrchestratorOptions {
  concept_id: string;
  /** Optional — when set, generation is scoped to one LO. */
  lo_id?: string;
  topic_family: string;
  /** Atom types to generate. Defaults to all 11. */
  atom_types?: AtomType[];
  /** Per-concept monthly budget cap in USD. */
  cost_cap_usd?: number;
  /** When true, skip writes to atom_versions (used by admin "preview" mode). */
  dry_run?: boolean;
  /** Progress callback fired before/during/after each atom step. */
  on_progress?: (event: ProgressEvent) => void;
  /**
   * Phase B of personalization plan — when present, the orchestrator threads
   * the student-context block into LLM prompts. Built via
   * src/personalization/student-context.ts:buildStudentContext().
   *
   * The shape is intentionally `unknown` here to keep the orchestrator
   * decoupled from the personalization module's internal types — the
   * caller passes the exact StudentContext payload, the orchestrator
   * forwards it untyped to the prompt formatter.
   *
   * Surveillance discipline: even with this set, the orchestrator NEVER
   * surfaces context values to the student via atom output. The atom
   * body the LLM produces should READ as if generically authored; the
   * context only steers tone/level/misconception-targeting.
   */
  student_context?: unknown;
  /**
   * Operator-selected primary generation model id — e.g. the first entry
   * of an admin-launched GenerationRun's config.pipeline.llm_models[].
   * Must be a model id present in config/providers.yaml (any configured
   * provider — gemini/anthropic/openai/openrouter/...). Defaults to
   * Claude when absent, matching pre-multi-provider behavior. For math
   * atoms (which run dual-model consensus), a distinct-provider second
   * opinion is chosen automatically — see orchestrator.ts's
   * pickConsensusSecondary().
   */
  model_id?: string;
  /**
   * Operator-selected model per cognitive tier, used when `model_id` is not
   * set. A reasoning atom (definition, worked example, exercise) goes to the
   * thinking model; a formatting atom (hook, mnemonic, retrieval prompt) goes
   * to the cheaper one. Which atom type sits in which tier is fixed in
   * model-tiers.ts and is deliberately NOT operator-editable — putting a
   * worked example on the cheap tier saves cents and costs a wrong answer.
   */
  tier_models?: { thinking?: string; formatting?: string };
  /**
   * Parent GenerationRun id — stamped onto atom_versions rows so an
   * admin-launched run's artifacts are traceable back to it (see
   * src/generation/run-dispatcher.ts). Absent for the syllabus-driven
   * content-generation job and other unlabeled callers, same as today.
   */
  generation_run_id?: string;
}

export interface ProgressEvent {
  /** 'start' fires once at the beginning, 'atom_*' per atom_type, 'done' once at end. */
  type: 'start' | 'atom_started' | 'atom_finished' | 'atom_rejected' | 'done';
  step_index: number;
  total_steps: number;
  atom_type?: AtomType;
  atom_id?: string;
  /** Source(s) used: ['claude'], ['claude','gemini'], etc. */
  sources?: GenerationSource[];
  /** Set on atom_finished. */
  judge_score?: number;
  /** Set on atom_rejected. */
  reason?: string;
  /** Set on done. */
  total_cost_usd?: number;
  total_accepted?: number;
  total_rejected?: number;
}
