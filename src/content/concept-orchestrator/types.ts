/**
 * types.ts — shared types for the Concept Generation Framework v1.
 */

import type { AtomType, BloomLevel } from '../content-types';

/** Source identifier for the cascade. */
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
}

export interface GeneratedAtom {
  /** Stable atom_id (e.g. "calculus-derivatives.intuition"). */
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
  /** Force regen even if a recent version exists. */
  force?: boolean;
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
