// @ts-nocheck
/**
 * Syllabus Types — scope-aware learning plan generation
 *
 * An exam scope is a categorization that changes which learning objectives
 * matter. The same concept (e.g., "eigenvalues") requires different mastery
 * levels for a quick-fire MCQ exam versus a long-form written exam.
 *
 * Built on top of the existing concept graph (src/constants/concept-graph.ts)
 * and the GBrain student model, so a generated syllabus is always personalized
 * to the student's current state.
 */

import type { ConceptNode } from '../constants/concept-graph';

// ============================================================================
// Exam scope — the single knob that reshapes learning objectives
// ============================================================================

/**
 * The scope of an exam determines what "mastering" a concept means.
 *
 * - mcq-fast: Multiple-choice, 1-2 marks, time-pressured. Wins go to
 *             recognition speed, shortcut formulas, option-elimination.
 *             Deep derivation is a waste of time.
 *
 * - mcq-rigorous: Multiple-choice but complex (GATE 2-mark numerical answer
 *             types). Still options, but computation must be done. Shortcuts
 *             matter, but so does process correctness.
 *
 * - subjective-short: Written answer, short-form (3-5 marks). Student must
 *             show reasoning steps. Partial credit. Notation matters.
 *
 * - subjective-long: Long-form derivation (10+ marks). Full proof-style
 *             thinking required. Novel problem-solving prized.
 *
 * - oral-viva: Examiner-led Q&A. Explanation quality, conceptual fluency,
 *             and cross-topic connections matter most.
 *
 * - practical: Lab-type, applied. Tool proficiency, debugging, iterative
 *             refinement. Theory is scaffolding.
 */
export type ExamScope =
  | 'mcq-fast'
  | 'mcq-rigorous'
  | 'subjective-short'
  | 'subjective-long'
  | 'oral-viva'
  | 'practical';

/**
 * Bloom's-inspired cognitive depth. Lower = recognition, higher = synthesis.
 * Different scopes target different depth bands.
 */
export type CognitiveDepth =
  | 'recognize'    // pattern-match a known shape
  | 'recall'       // retrieve a formula or definition
  | 'apply'        // plug values into a known procedure
  | 'analyze'      // decompose, identify relevant principles
  | 'evaluate'     // judge between strategies, estimate tradeoffs
  | 'create';      // synthesize novel derivations or proofs

/**
 * A learning objective ties one cognitive depth + success criterion to one concept.
 * Every syllabus node carries multiple objectives, ordered by priority within
 * the target scope.
 */
export interface LearningObjective {
  id: string;                       // stable kebab-case ID for tracking progress
  concept_id: string;               // FK to concept graph
  depth: CognitiveDepth;
  statement: string;                // "Given a 2×2 matrix, recognize whether it's diagonalizable"
  success_criterion: string;        // how GBrain decides this is mastered
  estimated_time_minutes: number;   // rough study time for a typical student
  priority: 1 | 2 | 3;              // 1 = must, 2 = should, 3 = nice-to-have
  applies_to_scopes: ExamScope[];   // which scopes require this objective
}

// ============================================================================
// Sources — attributed, licensed reading material per concept
// ============================================================================

/**
 * A reading/practice source with license + attribution. Every syllabus node
 * references ≥1 source so students know what to study and we respect
 * the license of upstream authors.
 */
export interface SyllabusSource {
  title: string;
  url: string;
  license: 'CC-BY' | 'CC-BY-SA' | 'CC-BY-NC-SA' | 'CC-BY-NC' | 'public-domain' | 'fair-use';
  attribution: string;              // full citation line for the license
  type: 'textbook-chapter' | 'lecture-video' | 'problem-set' | 'past-paper' | 'reference-sheet' | 'tutorial';
  estimated_time_minutes: number;
  recommended_for_scopes: ExamScope[];
  /** Optional tags for filtering: "cheatsheet", "derivation", "worked-examples", etc. */
  tags?: string[];
}

// ============================================================================
// Strategy hints — scope-specific tips beyond raw content
// ============================================================================

/**
 * A strategy hint is a scope-specific piece of meta-advice.
 * "Shortcut formula" / "elimination trick" matters for mcq-fast.
 * "Always show dimensional analysis" matters for subjective-long.
 */
export interface StrategyHint {
  scope: ExamScope;
  category: 'shortcut' | 'elimination' | 'time-budget' | 'derivation-template' | 'notation' | 'common-trap' | 'memorization-aid';
  advice: string;
  example?: string;
}

// ============================================================================
// Syllabus node — one concept, scoped to an exam
// ============================================================================

export interface SyllabusNode {
  concept_id: string;
  concept_label: string;
  topic: string;
  gate_frequency: ConceptNode['gate_frequency'];
  difficulty_base: number;

  /** Why this concept is in the syllabus for this scope. */
  inclusion_reason: 'core' | 'prerequisite' | 'frequently-tested' | 'student-weak-spot' | 'student-interest';

  /** Ordered — first is highest priority for this scope. */
  objectives: LearningObjective[];

  /** Curated reading/practice material. */
  sources: SyllabusSource[];

  /** Scope-specific meta-strategy. */
  strategy_hints: StrategyHint[];

  /** What the student already knows per GBrain, informs sequencing. */
  current_mastery: number;          // 0..1 from student model
  zpd_ready: boolean;               // true if student's ZPD includes this concept

  /** When to study (day number in the plan, 1-indexed). */
  scheduled_day: number;
  estimated_study_minutes: number;
}

// ============================================================================
// Top-level syllabus
// ============================================================================

export interface Syllabus {
  id: string;                       // generated deterministic hash
  generated_at: string;             // ISO timestamp

  /** Inputs that produced this syllabus. */
  exam_id: string;                  // 'gate-ma', 'jee-advanced-math', etc.
  exam_name: string;
  scope: ExamScope;
  target_date: string | null;       // ISO date; null if no deadline
  daily_minutes: number;            // how much time student commits per day

  /** Student context. */
  session_id: string;
  student_snapshot: {
    total_attempts: number;
    overall_mastery: number;
    weak_topics: string[];
    strong_topics: string[];
  };

  /** The actual content, ordered by scheduled_day. */
  nodes: SyllabusNode[];

  /** Summary statistics. */
  stats: {
    total_concepts: number;
    total_study_minutes: number;
    estimated_days: number;
    coverage_by_topic: Record<string, number>;
    depth_distribution: Record<CognitiveDepth, number>;
  };

  /** Narrative intro generated based on scope + student state. */
  intro: string;
  /** Closing advice specific to scope. */
  closing: string;
}

export interface SyllabusRequest {
  exam_id: string;
  scope: ExamScope;
  session_id?: string;              // for personalization; anonymous if absent
  target_date?: string;             // ISO date
  daily_minutes?: number;           // default 60
  topic_filter?: string[];          // optional: restrict to these topics
  max_concepts?: number;            // hard cap, default 50
}
