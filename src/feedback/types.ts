// @ts-nocheck
/**
 * Feedback Framework — Types
 *
 * A generic, exam-agnostic feedback system that lets real students submit
 * structured observations about any exam's content, and lets admins review,
 * approve, and apply those observations back to the exam spec.
 *
 * The same framework works for BITSAT, GATE, NEET, JEE, UPSC, or any
 * other exam registered in the dynamic exam system.
 *
 * Design principles:
 *
 * 1. Feedback has a KIND. Different kinds flow through different review
 *    and apply paths. A wrong-answer report needs a fast fix; a
 *    topic-weight recalibration needs cohort aggregation before change.
 *
 * 2. Every feedback has a TARGET. The target is addressable — a specific
 *    exam, lesson component, mock question, strategy, or topic weight
 *    can be named and reached.
 *
 * 3. Every feedback has a LIFECYCLE: submitted → triaged → approved/
 *    rejected → applied. Students see their feedback move through these
 *    states. Approved-and-applied changes show the submitter which
 *    release landed their contribution.
 *
 * 4. Aggregation is first-class. "N students reported X" is structurally
 *    different from "1 student reported X" — the framework counts
 *    corroborations and surfaces signal strength to reviewers.
 */

// ============================================================================
// Feedback KINDS — the vocabulary of things a student can say
// ============================================================================

/**
 * Every feedback item is one of these kinds. Each kind has its own target
 * schema, review flow, and apply logic.
 */
export type FeedbackKind =
  /** "Question 3's correct answer is wrong / has a typo / is ambiguous" */
  | 'mock_question_error'
  /** "Your mock is missing a question type that BITSAT actually tests" */
  | 'mock_coverage_gap'
  /** "You're missing topic X from the syllabus" */
  | 'syllabus_missing_topic'
  /** "Topic Y's weight is too low/high based on recent papers" */
  | 'topic_weight_recalibration'
  /** "Lesson component has an error / unclear explanation" */
  | 'lesson_content_error'
  /** "This common trap doesn't match my actual experience" */
  | 'trap_mismatch'
  /** "Please add a new trap I fell into" */
  | 'trap_addition'
  /** "Strategy threshold doesn't match my pacing" */
  | 'strategy_preference'
  /** "Add a strategy I found useful that you don't have" */
  | 'strategy_addition'
  /** "Exam metadata is wrong (date, duration, marking, etc.)" */
  | 'exam_metadata_error'
  /** Generic catch-all */
  | 'other';

/**
 * Target — addressable location in the exam content tree.
 * Every target carries exam_id; most also specify a deeper location.
 */
export interface FeedbackTarget {
  exam_id: string;                          // e.g. "EXM-BITSAT-MATH-SAMPLE"
  mock_id?: string;                          // e.g. "mock-bitsat-math-01"
  question_id?: string;                      // e.g. "q3"
  lesson_id?: string;                        // e.g. "lesson-bitsat-limits"
  component_id?: string;                     // e.g. "limits-worked"
  topic_id?: string;                         // e.g. "calculus"
  strategy_title?: string;                   // e.g. "The 90-second skip rule"
}

/**
 * Status lifecycle. Every feedback transitions forward-only through these.
 */
export type FeedbackStatus =
  | 'submitted'       // New, awaiting triage
  | 'triaged'         // Admin has reviewed; assigned priority + kind
  | 'approved'        // Admin approved; pending implementation
  | 'rejected'        // Admin declined (with reason)
  | 'applied'         // Change is live in exam content
  | 'duplicate';      // Merged into another feedback (see merged_into)

/**
 * Priority — how urgently the change needs to land.
 * Wrong answer keys are P0 (fix today). Weight recalibration is P2
 * (cohort data needed first). Preference is P3 (consider with bulk review).
 */
export type FeedbackPriority = 'P0' | 'P1' | 'P2' | 'P3';

// ============================================================================
// Core feedback record
// ============================================================================

export interface FeedbackItem {
  id: string;                               // "FB-{kind}-{8-char-nano}"
  kind: FeedbackKind;
  target: FeedbackTarget;

  /** The student's own words. Required — no anonymous upvotes. */
  description: string;

  /**
   * Structured suggestion — kind-specific shape.
   * e.g. { proposed_correct_option: 2 } for mock_question_error
   * e.g. { proposed_weight: 0.30 } for topic_weight_recalibration
   * e.g. { proposed_trap: {...} } for trap_addition
   */
  suggestion?: Record<string, any>;

  /**
   * Evidence the student provides to back up the feedback.
   * e.g. URL to a past paper, a screenshot path, a textbook citation.
   * Optional but strongly encouraged for content-correction kinds.
   */
  evidence?: string[];

  /** Metadata about the submitter — only what we need */
  submitted_by: {
    user_id: string;
    display_name?: string;                   // For attribution if allowed
    anonymous: boolean;                       // Hide display_name from public view
    submitted_at: string;                     // ISO date
  };

  /** Lifecycle state */
  status: FeedbackStatus;
  priority?: FeedbackPriority;
  triaged_at?: string;
  triaged_by?: string;
  approved_at?: string;
  approved_by?: string;
  applied_at?: string;
  applied_in_release?: string;               // e.g. "v2.14.1"
  rejection_reason?: string;
  merged_into?: string;                      // Id of canonical feedback if duplicate

  /**
   * Corroboration count — how many other students have submitted
   * feedback that overlaps this one (same target, similar suggestion).
   * Updated at triage time. Drives priority elevation.
   */
  corroboration_count: number;

  /** Admin notes visible only to reviewers */
  admin_notes?: string;
}

// ============================================================================
// Applied-change audit trail
// ============================================================================

/**
 * When approved feedback is applied to exam content, an AppliedChange
 * record is written. Students can see, per-release, which feedback
 * items landed. This is the "your voice was heard" signal.
 */
export interface AppliedChange {
  id: string;                                // "AC-{8-char-nano}"
  feedback_id: string;
  exam_id: string;
  release_tag: string;                       // e.g. "v2.14.1"
  change_description: string;                // Human-readable
  applied_at: string;
  applied_by: string;                         // Admin user_id
  diff_summary?: string;                      // Optional machine-readable diff
}

// ============================================================================
// Triage aggregation — signal surface for reviewers
// ============================================================================

/**
 * The "feedback dashboard" view for admins. Produced by aggregating
 * all submitted feedback for an exam.
 */
export interface FeedbackDashboard {
  exam_id: string;
  total: number;
  by_status: Record<FeedbackStatus, number>;
  by_kind: Record<FeedbackKind, number>;
  by_priority: Record<FeedbackPriority, number>;
  /**
   * High-corroboration items — multiple students reporting the same
   * thing. These are the fastest wins for admins.
   */
  high_corroboration: Array<{ feedback_id: string; count: number; summary: string }>;
  /**
   * Items older than 7 days with no admin action. SLA warning.
   */
  stale_items: Array<{ feedback_id: string; days_old: number }>;
  /**
   * Recent applied changes — what students can see landed.
   */
  recent_applied: AppliedChange[];
}
