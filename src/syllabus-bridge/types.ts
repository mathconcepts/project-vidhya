/**
 * Syllabus Bridge — type definitions.
 *
 * The bridge framework maps a source curriculum (e.g. TN State Board Class 12
 * Mathematics) to a target exam (e.g. IIT JEE Main) and generates intuitive
 * content that helps students learn the source material AND close the gap to
 * the target exam's depth.
 *
 * Data flow:
 *   Curriculum (chapters + topics + concepts)
 *     -> BridgeMapping (per-topic: where they align, where the gap is)
 *       -> ContentPlan (foundation / bridge / advanced units to generate)
 *         -> BatchRequest (LLM job for one or more content units)
 *           -> GeneratedContent (stored, viewable, attachable to plans)
 */

// ============================================================================
// Curriculum — source material a student already studies at school
// ============================================================================

export interface CurriculumConcept {
  id: string;                  // 'tn-12-math.complex.argand-diagram'
  name: string;                // 'Argand diagram and polar form'
  /** TN textbook chapter or section number for reference */
  source_ref?: string;
  /** Cognitive load: 1 = trivial recall, 5 = advanced derivation */
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface CurriculumTopic {
  id: string;                  // 'tn-12-math.complex'
  name: string;                // 'Complex Numbers'
  /** Chapter number in the source textbook */
  chapter_number?: number;
  concepts: CurriculumConcept[];
  /** Time budget the school curriculum spends on this topic, in hours */
  estimated_hours: number;
}

export interface Curriculum {
  id: string;                  // 'TN-12-MATH'
  source_name: string;         // 'Tamil Nadu State Board'
  grade: string;               // 'Class 12'
  subject: string;             // 'Mathematics'
  display_name: string;        // 'TN Class 12 Mathematics'
  topics: CurriculumTopic[];
  /** Knowledge track id this curriculum sits under */
  knowledge_track_id?: string;
}

// ============================================================================
// Bridge mapping — connects source curriculum to a target exam
// ============================================================================

/** A single mapping row: source concept(s) -> target exam topic(s), with gap info. */
export interface BridgeMappingEntry {
  id: string;                  // stable id for this entry
  /** Source concept id(s) — usually 1 but can be 2-3 if the source bundles them */
  source_concept_ids: string[];
  /** Target exam topic id(s) — e.g. ['calculus', 'coordinate-geometry'] */
  target_topic_ids: string[];
  /**
   * Gap class:
   *   'aligned'       — source covers what target needs
   *   'depth-gap'     — source covers the concept but target needs deeper problems
   *   'breadth-gap'   — target needs adjacent concepts source skips
   *   'foundation'    — source skips this entirely; needs to be built from scratch
   */
  gap_class: 'aligned' | 'depth-gap' | 'breadth-gap' | 'foundation';
  /** Bridge note — author's reasoning, shown in admin UI */
  bridge_note: string;
  /** Expected difficulty jump (1 = same, 5 = major leap) */
  difficulty_jump: 1 | 2 | 3 | 4 | 5;
}

export interface BridgeMapping {
  id: string;                  // 'TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE'
  source_curriculum_id: string;
  target_exam_id: string;
  display_name: string;
  entries: BridgeMappingEntry[];
}

// ============================================================================
// Content plan — what to generate per mapping entry
// ============================================================================

export type ContentUnitType =
  | 'foundation-explainer'    // Re-teaches the TN concept at school level
  | 'worked-example'          // TN-textbook-style worked example
  | 'bridge-explainer'        // Connects TN concept to JEE technique
  | 'stretch-problem'         // JEE-level problem on the same concept
  | 'practice-set';           // Graduated problem set (TN -> bridge -> JEE)

export interface ContentUnit {
  unit_id: string;             // 'TN-12-MATH--EXM-JEEMAIN--complex.argand-diagram--bridge-explainer'
  mapping_entry_id: string;
  unit_type: ContentUnitType;
  /** What level of student this targets */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Approximate token count for budgeting batch costs */
  estimated_tokens: number;
}

export interface ContentPlan {
  mapping_id: string;
  units: ContentUnit[];
  /** Estimated total tokens to generate this plan */
  total_estimated_tokens: number;
}

// ============================================================================
// Batch — a submitted generation job over one or more units
// ============================================================================

export type BatchStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface BatchRequest {
  batch_id: string;
  mapping_id: string;
  unit_ids: string[];
  /** Who submitted (user id or 'system') */
  submitted_by: string;
  /**
   * Optional student id. When set, the batch generates content
   * personalized for this student — GBrain's student model is injected
   * into each prompt so the body matches their mastery + motivation.
   * Leave unset for generic 'pack' content shown to everyone.
   */
  for_student_id?: string;
  submitted_at: string;
  status: BatchStatus;
  started_at?: string;
  completed_at?: string;
  /** Per-unit results — populated as each unit finishes */
  results: BatchResult[];
  /** Aggregate stats */
  total_units: number;
  completed_units: number;
  failed_units: number;
  total_cost_estimate_usd: number;
  /** Free-form error message if status === 'failed' */
  error?: string;
}

export interface BatchResult {
  unit_id: string;
  status: 'pending' | 'success' | 'failed';
  content_id?: string;         // links into the content store
  error?: string;
  /** Tokens actually used (real or simulated) */
  tokens_used?: number;
  cost_usd?: number;
  generated_at?: string;
}

// ============================================================================
// Generated content — the stored output
// ============================================================================

export interface GeneratedContent {
  content_id: string;
  unit_id: string;
  unit_type: ContentUnitType;
  mapping_id: string;
  mapping_entry_id: string;
  /** Display title shown in admin + student UI */
  title: string;
  /** Full markdown body (LaTeX inline + display ok) */
  body_markdown: string;
  /** Generator metadata */
  source: 'mock' | 'gemini' | 'anthropic' | 'openai';
  model?: string;
  tokens_used?: number;
  cost_usd?: number;
  generated_at: string;
  /** For tracking quality/feedback later */
  quality_score?: number;
  /**
   * Set to true when explicit-feedback aggregation flags this content
   * as needing regeneration (mostly downvotes, or specific issue
   * categories like 'wrong-answer' / 'unclear').
   */
  flagged_for_regen?: boolean;
}

// ============================================================================
// Explicit feedback — students + teachers signal content quality
// ============================================================================

export type FeedbackRating = 'helpful' | 'not-helpful' | 'wrong' | 'unclear' | 'too-easy' | 'too-hard';

export interface ContentFeedback {
  feedback_id: string;
  content_id: string;
  unit_id: string;
  mapping_id: string;
  /** Who gave the feedback */
  user_id: string;
  role: 'student' | 'teacher' | 'admin';
  rating: FeedbackRating;
  /** Optional free-form comment, capped at ~500 chars at the API boundary */
  comment?: string;
  created_at: string;
}

/** Aggregated stats for one piece of content. Read-side projection. */
export interface FeedbackSummary {
  content_id: string;
  total: number;
  by_rating: Record<FeedbackRating, number>;
  /** Latest 5 comments for the admin to scan */
  recent_comments: Array<{ user_id: string; role: string; rating: FeedbackRating; comment: string; created_at: string }>;
  /** Derived: should this content be regenerated? */
  needs_regen: boolean;
  /** Reason needs_regen is true (or "ok" if false) */
  regen_reason: string;
}
