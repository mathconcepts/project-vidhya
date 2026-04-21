// @ts-nocheck
/**
 * Lesson Types — the atomic pedagogical unit in Vidhya.
 *
 * A Lesson is an 8-component structured object for one concept. Each
 * component is grounded in a learning-science principle (see
 * docs/LESSON-FRAMEWORK.md for full rationale). Components are optional
 * — the composer falls back gracefully when a source has no content.
 *
 * Design contract:
 *   - Every component carries attribution (source + license + author)
 *   - The base Lesson is stable and cacheable (pure function output)
 *   - Personalization is applied as a LAYER, not by mutation of the base
 *   - Engagement signals are first-class: every component has an id that
 *     the frontend can reference when reporting viewed/revealed/completed
 */

// ============================================================================
// Source attribution
// ============================================================================

export type SourceKind =
  | 'user-material'     // Student-uploaded, personally resonant
  | 'bundle-canon'      // Vidhya's curated content bundle
  | 'wolfram-computed'  // Live or cached Wolfram result
  | 'concept-graph'     // The 82-concept fallback
  | 'generated';        // LLM-synthesized (only as last resort)

export interface Attribution {
  kind: SourceKind;
  /** Free-form title of the source, e.g., "OpenStax Calculus Vol 1 Ch 5" */
  title?: string;
  /** Canonical URL to the source where available */
  url?: string;
  /** SPDX-style license string: "CC-BY-4.0", "CC-BY-NC-SA-4.0", "public-domain", "user-content" */
  license?: string;
  /** Author/institution attribution required by license */
  author?: string;
}

// ============================================================================
// Individual components
// ============================================================================

/**
 * Component 1 — Hook.
 *
 * "Why should you care about this concept?" Activates prior knowledge,
 * provides motivation. Research: elaborative interrogation.
 */
export interface HookComponent {
  kind: 'hook';
  id: string;
  text: string;                 // 1-3 sentences, conversational tone
  attribution?: Attribution;
}

/**
 * Component 2 — Definition.
 *
 * Both the canonical (formal) statement and a plain-English rephrase.
 * Research: schema activation — anchor the concept with precise language.
 */
export interface DefinitionComponent {
  kind: 'definition';
  id: string;
  canonical: string;            // Textbook-quality formal definition
  plain_english: string;        // One-sentence rephrase for the layperson
  attribution?: Attribution;
}

/**
 * Component 3 — Intuition.
 *
 * Visual, analogical, or physical analogy. Research: dual coding.
 * The `diagram_mermaid` field allows a lightweight visual without
 * shipping an image library — Mermaid renders in the browser.
 */
export interface IntuitionComponent {
  kind: 'intuition';
  id: string;
  text: string;                 // The "imagine..." narrative
  analogy?: string;             // Optional short metaphor
  diagram_mermaid?: string;     // Optional Mermaid source
  attribution?: Attribution;
}

/**
 * Component 4 — Worked Example.
 *
 * Fully solved problem with step-by-step reasoning and embedded
 * self-check prompts. Research: worked-examples effect.
 */
export interface WorkedStep {
  step_number: number;
  action: string;               // "Apply the chain rule to the inner function"
  math?: string;                // LaTeX if applicable
  explanation: string;          // WHY this step was chosen
  self_check_prompt?: string;   // Optional "What would change if...?" question
}

export interface WorkedExampleComponent {
  kind: 'worked_example';
  id: string;
  problem: string;              // The problem statement
  final_answer: string;
  steps: WorkedStep[];
  attribution?: Attribution;
  wolfram_verified?: boolean;
}

/**
 * Component 5 — Micro-Exercise.
 *
 * 30-second retrieval practice. Research: testing effect.
 * Short, low-stakes, with feedback.
 */
export interface MicroExerciseComponent {
  kind: 'micro_exercise';
  id: string;
  question: string;
  expected_answer: string;
  answer_explanation: string;   // Shown after the student answers
  difficulty: number;           // 0..1
  attribution?: Attribution;
  wolfram_verified?: boolean;
}

/**
 * Component 6 — Common Traps.
 *
 * Preemptively surfaced misconceptions. Research: preemptive error correction.
 * The `error_type` maps to the 7-type error taxonomy in src/gbrain/error-taxonomy.ts
 * so the personalizer can expand the trap relevant to a student's history.
 */
export interface TrapEntry {
  description: string;          // "Students often forget to take the absolute value"
  why_it_happens: string;       // "Because the problem statement doesn't emphasize the sign"
  error_type?: string;          // One of: conceptual | procedural | notation | arithmetic | misreading | strategic | careless
  correction?: string;          // How to avoid it
}

export interface CommonTrapsComponent {
  kind: 'common_traps';
  id: string;
  traps: TrapEntry[];
  attribution?: Attribution;
}

/**
 * Component 7 — Formal Statement.
 *
 * The precise mathematical statement, for the student who wants depth.
 * Placed LATE in the lesson (after intuition + example) per concrete→abstract
 * principle. Collapsible in the UI.
 */
export interface FormalStatementComponent {
  kind: 'formal_statement';
  id: string;
  statement: string;            // The theorem/definition in mathematical language
  latex: string;                // LaTeX rendering
  assumptions?: string[];       // Conditions under which it holds
  attribution?: Attribution;
}

/**
 * Component 8 — Connections.
 *
 * How this concept links to prerequisites (what you need first) and
 * dependents (what it unlocks). Research: schema weaving.
 */
export interface ConnectionsComponent {
  kind: 'connections';
  id: string;
  prerequisites: Array<{ concept_id: string; label: string; relationship: string }>;
  leads_to: Array<{ concept_id: string; label: string; relationship: string }>;
  attribution?: Attribution;
}

export type LessonComponent =
  | HookComponent
  | DefinitionComponent
  | IntuitionComponent
  | WorkedExampleComponent
  | MicroExerciseComponent
  | CommonTrapsComponent
  | FormalStatementComponent
  | ConnectionsComponent;

// ============================================================================
// The Lesson itself
// ============================================================================

/**
 * The ordered component sequence. The personalizer may skip components
 * or reorder them, but never mutates the base object (returns a new one).
 */
export const COMPONENT_ORDER: Array<LessonComponent['kind']> = [
  'hook',
  'definition',
  'intuition',
  'worked_example',
  'micro_exercise',
  'common_traps',
  'formal_statement',
  'connections',
];

export interface Lesson {
  concept_id: string;
  concept_label: string;
  topic: string;

  /** Components in render order. Missing components are simply absent. */
  components: LessonComponent[];

  /** Aggregate metadata */
  estimated_minutes: number;
  difficulty_base: number;
  /** Completeness 0..1 — fraction of the 8 components that have real content */
  quality_score: number;
  /** All unique sources cited across components */
  sources: Attribution[];

  /** Whether this lesson was personalized, and how */
  personalization_applied: string[];   // e.g., ["skip_hook_due_to_mastery", "expand_traps_due_to_errors"]

  /** Related-problems recommendations (attached after main composition) */
  related_problems?: Array<{
    id: string;
    concept_id: string;
    question_text: string;
    difficulty: number;
    relationship: 'same-concept-harder' | 'interleaved' | 'prerequisite-review';
    source: string;
    wolfram_verified: boolean;
  }>;

  /** Next spaced-review date, if the student has completed a prior visit */
  next_review_at?: string;      // ISO date

  /** Rendering hints */
  is_revisit: boolean;          // First time vs return visit — changes component emphasis
  generated_at: string;
}

// ============================================================================
// Engagement signals
// ============================================================================

export interface EngagementSignal {
  concept_id: string;
  component_id: string;
  component_kind: LessonComponent['kind'];
  event: 'viewed' | 'revealed' | 'completed' | 'skipped';
  duration_ms?: number;
  /** For micro_exercise: was the student's answer correct? */
  correct?: boolean;
  /** For self-recorded difficulty rating after completion (1 = easy, 5 = hard) */
  difficulty_rating?: number;
  timestamp: string;
  session_id?: string;
}

// ============================================================================
// Student snapshot (duck-typed — accepts client or server student model)
// ============================================================================

export interface StudentSnapshot {
  session_id?: string;
  mastery_by_concept?: Record<string, number>;   // 0..1
  mastery_by_topic?: Record<string, number>;
  recent_errors?: Array<{ concept_id: string; error_type: string }>;
  last_lesson_visit?: Record<string, {            // concept_id → visit metadata
    last_visited_at: string;
    visit_count: number;
    sm2_interval_days: number;
    sm2_ease_factor: number;
  }>;
  /** Has the student uploaded materials the RAG can surface? */
  has_materials?: boolean;
  /** Optional scope context from syllabus */
  scope?: 'mcq-fast' | 'mcq-rigorous' | 'subjective-short' | 'subjective-long' | 'oral-viva' | 'practical';
}

// ============================================================================
// Request shape
// ============================================================================

export interface LessonRequest {
  concept_id: string;
  session_id?: string;
  student?: StudentSnapshot;
  /** When true, forces first-visit layout even if student has history */
  force_full?: boolean;
  /** Optional user-material chunk IDs to surface (passed from the client's IndexedDB) */
  user_material_chunks?: Array<{
    material_id: string;
    material_title: string;
    chunk_text: string;
    similarity: number;
  }>;
}
