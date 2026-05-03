/**
 * src/blueprints/types.ts
 *
 * Locked v1 contract for the Content Blueprint `decisions` JSONB.
 *
 * SURVEILLANCE: every field here describes a CONTENT CHOICE — never
 * student behaviour. No user_id, session_id, behavioural enum.
 * Invariant 8 in surveillance-invariants.test.ts enforces this.
 *
 * v1 is permanent. Future shape changes land as a parallel BlueprintDecisionsV2
 * type + a new persisted column `decisions_v2 JSONB`. Never mutate this.
 */

export type AtomKind =
  | 'visual_analogy'
  | 'manipulable'
  | 'simulation'
  | 'guided_walkthrough'
  | 'mcq'
  | 'free_text'
  | 'worked_example'
  | 'pyq_anchor';

export type DifficultyLabel = 'easy' | 'medium' | 'hard';

export interface DifficultyMix {
  easy: number;
  medium: number;
  hard: number;
}

export type StageKind =
  | 'intuition'      // build mental picture before formalism
  | 'discovery'      // student explores via interactive
  | 'formalism'      // crisp definition / theorem
  | 'worked_example' // narrated walk-through
  | 'practice'       // mcq / numerical at scale
  | 'pyq_anchor';    // bridge to past-paper question

export interface BlueprintStage {
  id: StageKind;
  atom_kind: AtomKind;
  /** Required when stage.id === 'practice'. */
  count?: number;
  difficulty_mix?: DifficultyMix;
  rationale_id: string;
  /** Optional human-readable note from operator or arbitrator. */
  rationale_note?: string;
}

export type ConstraintSource = 'template' | 'arbitrator' | 'operator' | 'ruleset';

export interface BlueprintConstraint {
  id: string;
  source: ConstraintSource;
  note?: string;
}

export interface BlueprintMetadata {
  concept_id: string;
  exam_pack_id: string;
  target_difficulty: DifficultyLabel;
}

export interface BlueprintDecisionsV1 {
  version: 1;
  metadata: BlueprintMetadata;
  stages: BlueprintStage[];
  constraints: BlueprintConstraint[];
}

// ----------------------------------------------------------------------------
// Persisted shape — the row as DB stores it
// ----------------------------------------------------------------------------

export type CreatedBy = 'template' | 'arbitrator' | 'operator';

export interface ContentBlueprint {
  id: string;
  exam_pack_id: string;
  concept_id: string;
  template_version: string | null;
  arbitrator_version: string | null;
  decisions: BlueprintDecisionsV1;
  confidence: number;
  requires_review: boolean;
  created_by: CreatedBy;
  approved_at: string | null;
  approved_by: string | null;
  superseded_by: string | null;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Closed enum of allowed values — keeps validator + UI in sync
// ----------------------------------------------------------------------------

export const ATOM_KINDS: ReadonlyArray<AtomKind> = [
  'visual_analogy',
  'manipulable',
  'simulation',
  'guided_walkthrough',
  'mcq',
  'free_text',
  'worked_example',
  'pyq_anchor',
];

export const STAGE_KINDS: ReadonlyArray<StageKind> = [
  'intuition',
  'discovery',
  'formalism',
  'worked_example',
  'practice',
  'pyq_anchor',
];

export const CONSTRAINT_SOURCES: ReadonlyArray<ConstraintSource> = [
  'template',
  'arbitrator',
  'operator',
  'ruleset',
];

/**
 * Closed enum of rationale codes. Add new codes forward — never rename.
 * The lift ledger joins on these strings.
 */
export const RATIONALE_CODES = {
  // Template-level rationale
  default_template: 'Standard concept template, no specialisation triggered',
  default_practice_mix: 'Default difficulty mix for the practice stage',

  // Concept-shape-driven
  concept_is_geometric: 'Concept benefits from visual/geometric framing',
  concept_is_algebraic: 'Concept benefits from symbolic manipulation',
  concept_is_computational: 'Concept benefits from worked numerical example',

  // Discovery rationale
  param_space_small_enough: 'Parameter space lets a slider/manipulable expose the structure',
  param_space_too_large: 'Parameter space too large; manipulable would mislead',

  // PYQ anchor rationale
  pyq_anchor_required_by_pack: 'Exam pack requires every unit to anchor on a real PYQ',
  pyq_anchor_optional: 'PYQ anchor included by template default',

  // Constraint sources
  no_jargon_first_definition: 'Lead with intuition, not formal language',
  always_include_pyq_anchor: 'Anchor every unit to a real exam question',
} as const;

export type RationaleCode = keyof typeof RATIONALE_CODES;
