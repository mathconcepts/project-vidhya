/**
 * src/registry/types.ts
 *
 * Shared types for the three versioned registries:
 *   - pain-points/<module>.yml  (pp_*, ue_*)
 *   - pedagogy-patterns.yml     (ped_*)
 *   - misconceptions (m_*)      — CAS-First T-A/T-B deliverable, same id discipline
 *
 * Id discipline: pp_*, ue_*, ped_* all share one namespace. No two ids may
 * collide across the three registries. Schema is validated at CI load time.
 *
 * Review discipline: a module with review_status='draft' is NEVER consumed
 * by prompt assembly or the modality orchestrator. Draft modules are
 * counted on the coverage meter but steer nothing.
 */

export type ReviewStatus = 'draft' | 'reviewed';

// ---------------------------------------------------------------------------
// Pain-Point Registry (E1)
// ---------------------------------------------------------------------------

export type Severity = 'low' | 'med' | 'high';

/** An atom-level artifact hint that votes on modality selection. */
export type ArtifactHint =
  | 'cheatsheet'      // → STATIC card
  | 'flowchart'       // → DYNAMIC guided_walkthrough
  | 'visualization'   // → MANIM / MATHBOX
  | 'wizard'          // → DYNAMIC guided_walkthrough
  | 'drill';          // → practice sequence

export interface PainPoint {
  id: string;           // pp_*
  statement: string;
  severity: Severity;
  source: string;
}

export interface UserExpectation {
  id: string;           // ue_*
  statement: string;
  artifact_hint?: ArtifactHint;
}

export interface GateIntent {
  mark_class: (1 | 2)[];
  question_kinds: string[];
  framing: string;
}

export interface ConceptPainEntry {
  pain_points: PainPoint[];
  user_expectations: UserExpectation[];
  /** Join key to m_* misconception registry (activates once CAS T-A lands). */
  rule_families?: string[];
  gate_intent?: GateIntent;
  /** Which ped_* patterns are recommended for this concept. */
  pedagogy_patterns?: string[];
  competitor_benchmark?: string[];
}

export interface PainPointModuleFile {
  review_status: ReviewStatus;
  module: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  /** Keyed by concept_id. */
  [concept_id: string]: ConceptPainEntry | ReviewStatus | string | null;
}

export interface PainPointModule {
  module: string;
  review_status: ReviewStatus;
  concepts: Record<string, ConceptPainEntry>;
}

// ---------------------------------------------------------------------------
// Pedagogy-Pattern Registry (E4)
// ---------------------------------------------------------------------------

export type PatternStatus = 'candidate' | 'active' | 'retired';

export interface PedagogyPattern {
  id: string;            // ped_*
  name: string;
  description: string;
  applicable_modules: string[];
  /** Optional ordered stage sequence this pattern prescribes. */
  blueprint_stages?: string[];
  /** Directives injected into the LLM prompt when this pattern applies. */
  prompt_directives: string[];
  /** Preferred modality for this pattern. */
  modality_bias?: string;
  /** Evidence citation (source doc or experiment id). */
  evidence: string;
  status: PatternStatus;
  version: number;
}

export interface PedagogyPatternRegistry {
  review_status: ReviewStatus;
  patterns: PedagogyPattern[];
}
