// @ts-nocheck
/**
 * Curriculum Framework — Core Types
 *
 * The authoritative schema for exam definitions, concept-to-exam links,
 * content gaps, quality signals, and compounding metrics. See
 * docs/CURRICULUM-FRAMEWORK.md for the full rationale.
 *
 * Design contract:
 *   - Exam definitions are DATA (YAML), not code
 *   - Concepts are shared across exams; links specify per-exam depth/scope
 *   - Quality is iteratively compounded; every iteration is measurable
 *   - User materials layer on top of admin content, never replace
 */

// ============================================================================
// Depth and scope vocabulary
// ============================================================================

/**
 * How deep the treatment is expected to go for an exam. Used by the
 * Lesson composer to filter worked examples and formal statements.
 */
export type ConceptDepth = 'introductory' | 'standard' | 'advanced';

/**
 * Matches the ExamScope from the syllabus subsystem — kept separate here
 * so this module has no circular dependency on src/syllabus/.
 */
export type CurriculumScope =
  | 'mcq-fast'
  | 'mcq-rigorous'
  | 'subjective-short'
  | 'subjective-long'
  | 'oral-viva'
  | 'practical';

// ============================================================================
// ExamDefinition — one YAML per exam
// ============================================================================

export interface ExamMetadata {
  id: string;                      // "gate-ma"
  name: string;                    // "GATE Engineering Mathematics"
  conducting_body: string;         // "IIT (rotates)"
  year_effective_from?: number;
  syllabus_source_url?: string;    // where admin sourced the official syllabus
  description?: string;
  scope: CurriculumScope;
  total_marks?: number;
  duration_minutes?: number;
  language: string;                // "en", "hi", etc.
}

/**
 * One top-level section of an exam's syllabus. Mirrors how exam-conducting
 * bodies structure their official docs: "Section A: Linear Algebra, weight
 * 15%", etc.
 */
export interface SyllabusSection {
  id: string;                      // "section-a", or a topic slug
  title: string;                   // "Linear Algebra"
  weight_pct: number;              // 15 = 15% of the exam
  /** Optional human-readable description of what's covered */
  description?: string;
  /** Hierarchical sub-sections if the exam has them */
  sub_sections?: SyllabusSection[];
  /** Concept IDs from the concept graph covered by this section */
  concept_ids: string[];
}

/**
 * How a concept appears in a specific exam. The same concept has multiple
 * ConceptExamLink entries — one per exam — each with its own depth/emphasis.
 */
export interface ConceptExamLink {
  concept_id: string;
  depth: ConceptDepth;
  /** Relative importance within the exam, 0..1. Sum across all links ≈ 1. */
  weight: number;
  /**
   * Tag-like hints the Lesson composer uses to prefer matching examples.
   * Examples: ["shortcut-methods", "2x2-and-3x3-matrices", "numerical-computation"]
   */
  emphasis: string[];
  /**
   * Scope-limiting phrases. If a piece of content contains any of these as
   * a topic, the guardrail will exclude it for this exam. Used to prevent
   * off-syllabus drift.
   * Examples: ["infinite-dimensional", "abstract-spectral-theory"]
   */
  restrictions: string[];
  /** Optional note for curators */
  curator_note?: string;
}

export interface ExamDefinition {
  metadata: ExamMetadata;
  syllabus: SyllabusSection[];
  concept_links: ConceptExamLink[];
}

// ============================================================================
// ContentGap — what's missing for an exam
// ============================================================================

export interface ContentGap {
  concept_id: string;
  concept_label: string;
  topic: string;
  exam_id: string;
  /** Weight of this concept in the exam — higher means gap is more important */
  exam_weight: number;

  missing: {
    /** true if explainer has no canonical_definition or deep_explanation */
    explainer_body: boolean;
    /** true if explainer has no worked_examples */
    worked_examples: boolean;
    /** true if explainer has no common_misconceptions */
    misconceptions: boolean;
    /** 0 if we have none, target is typically 3 */
    practice_problems_have: number;
    practice_problems_target: number;
    /** 0 if we have none, target is typically 2 */
    wolfram_verified_have: number;
    wolfram_verified_target: number;
  };

  /**
   * Priority score — higher means fix this first.
   * Formula: weight × (emptiness_fraction) × (1 + student_demand_signal)
   */
  priority: number;
}

// ============================================================================
// Quality signals + aggregation
// ============================================================================

/**
 * A single engagement event emitted by the lesson UI. Matches the shape
 * the existing /api/lesson/engagement endpoint already receives.
 */
export interface QualitySignal {
  concept_id: string;
  component_kind:
    | 'hook'
    | 'definition'
    | 'intuition'
    | 'worked_example'
    | 'micro_exercise'
    | 'common_traps'
    | 'formal_statement'
    | 'connections';
  event: 'viewed' | 'revealed' | 'completed' | 'skipped';
  /** When the event happened — aggregator uses this to bucket by iteration */
  timestamp: string;
  /** Only for micro_exercise: was the answer correct? */
  correct?: boolean;
  /** Duration component was on screen */
  duration_ms?: number;
  session_id?: string;
}

/**
 * Per-(concept × component) rolled-up quality for one iteration window.
 */
export interface ComponentQuality {
  concept_id: string;
  component_kind: QualitySignal['component_kind'];
  /** Monotonic counter — bumped when the admin runs a "new iteration" cycle */
  iteration: number;
  observations: number;             // total signals seen
  engagement: {
    view_rate: number;              // 0..1
    reveal_rate: number;            // 0..1 (for components with reveal affordance)
    completion_rate: number;        // 0..1
    skip_rate: number;              // 0..1 — the bad one
    /** For micro_exercise only */
    micro_exercise_success_rate: number | null;
  };
  /** Composite 0..1 — higher = better. See quality-aggregator for formula. */
  quality_score: number;
  /** Below-threshold components flagged for curator review */
  needs_review: boolean;
  /** Reason flagged, human-readable */
  flag_reason: string | null;
  last_updated: string;
}

/**
 * Top-level iteration snapshot. The admin dashboard compares against
 * the previous iteration to show whether quality is compounding.
 */
export interface QualityIterationSnapshot {
  iteration: number;
  started_at: string;
  ended_at?: string;
  total_components: number;
  avg_quality_score: number;
  flagged_count: number;
  /** Iteration-over-iteration delta in avg_quality_score */
  delta_vs_previous: number | null;
  /** Per-concept aggregates */
  per_concept: ComponentQuality[];
}

// ============================================================================
// Guardrail check results
// ============================================================================

export interface GuardrailCheckResult {
  /** True if the item is acceptable for this exam context */
  allowed: boolean;
  /** Primary concept_id the item was classified as */
  matched_concept_id: string | null;
  /** 0..1 confidence in the classification */
  confidence: number;
  /**
   * If not allowed, which rule rejected it:
   *   off-syllabus            — concept not in exam's concept_links
   *   depth-mismatch          — content is deeper than exam requires
   *   restricted-subtopic     — hit an explicit restriction tag
   *   below-confidence        — couldn't classify with enough confidence
   */
  rejection_reason: 'off-syllabus' | 'depth-mismatch' | 'restricted-subtopic' | 'below-confidence' | null;
  /** Human-readable warning for the UI */
  warning: string | null;
}

// ============================================================================
// Query shapes
// ============================================================================

/**
 * When the Lesson composer queries the curriculum, this is what it gets back
 * for the active (concept × exam) pair.
 */
export interface CurriculumContext {
  exam_id: string;
  concept_id: string;
  link: ConceptExamLink | null;    // null if concept is not in this exam
  /** Filter tags the composer applies to worked examples and problems */
  allowed_difficulty_max: number;  // 0..1, derived from depth
  allowed_emphasis: string[];
  restrictions: string[];
}

// ============================================================================
// Learning Objectives + Exam Overlays (ContentAtom v2)
// ============================================================================

import type { BloomLevel, AtomType } from '../content/content-types';

/**
 * Bloom-aligned learning objective. Authored in `meta.yaml` per concept.
 * Each LO has explicit mastery criteria so progress can be measured.
 */
export interface LearningObjective {
  id: string;                        // e.g. "calculus-derivatives.lo.product-rule"
  text: string;                      // "Apply the product rule to compute (fg)'"
  bloom_level: BloomLevel;
  mastery_criteria: {
    min_correct_streak: number;      // e.g. 3
    target_score: number;            // 0.0–1.0, mastery threshold
  };
}

/**
 * Per-exam customisation layer on top of universal concept content.
 * `meta.yaml` carries `exam_overlays: Record<exam_id, ExamOverlay>`.
 *
 * PedagogyEngine applies the overlay matching `preferred_exam_id` (if any)
 * before serving atoms. Wildcard atoms (`exam_ids: ["*"]`) bypass
 * `skip_atom_types` but still respect `required_bloom_levels`.
 */
export interface ExamOverlay {
  /** Bloom levels the exam tests; atoms below this floor are filtered. */
  required_bloom_levels: BloomLevel[];
  emphasis: 'skip' | 'light' | 'standard' | 'deep';
  /** Atom types to skip for this exam (e.g. exam doesn't test mnemonics). */
  skip_atom_types: AtomType[];
}

/**
 * Full concept metadata loaded from `meta.yaml`.
 *
 * **Additive schema:** existing fields (title, licence, contributor, tags, exams,
 * difficulty, wolfram_checkable, etc.) are preserved unchanged. ContentAtom v2
 * adds `learning_objectives[]` and `exam_overlays` as optional new fields.
 *
 * The existing `exams: string[]` array remains the universal-eligibility list;
 * `exam_overlays` keyed by exam_id is the per-exam customisation layer on top.
 */
export interface ConceptMeta {
  // ── Existing fields (preserved from v1 meta.yaml) ─────────────────────
  concept_id: string;
  title?: string;
  licence?: string;
  contributor?: string;
  contributor_github?: string;
  reviewed_at?: string;
  difficulty?: 'intro' | 'intermediate' | 'advanced';
  derived_from?: string | null;
  wolfram_checkable?: boolean;
  tags?: string[];
  exams?: string[];

  // ── New fields (ContentAtom v2) ───────────────────────────────────────
  learning_objectives?: LearningObjective[];
  exam_overlays?: Record<string, ExamOverlay>;
}
