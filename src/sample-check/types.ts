// @ts-nocheck
/**
 * Sample Check Workflow — Types
 *
 * A SampleCheck is a versioned, shareable snapshot of exam content
 * (exam spec + mocks + lessons + strategies at a specific moment) that
 * an admin requests for real-student review. Every snapshot carries a
 * unique shareable token. Students click the link, exercise the sample,
 * and submit structured feedback against that exact snapshot version.
 *
 * Core invariants:
 *
 * 1. VERSION-PINNED. Feedback attaches to a specific SampleCheck
 *    version, not to the underlying exam. This matters when the same
 *    exam has multiple sample creations over time — feedback on v1
 *    stays bound to v1 content. When v2 is created, v1's unresolved
 *    feedback becomes "eligible to carry forward" — admin decides
 *    explicitly whether each item still applies.
 *
 * 2. CROSS-EXAM RELEVANCE IS EXPLICIT. When admin triages feedback,
 *    they can mark it as "also applies to exam X" producing a
 *    CrossExamLink. The framework does not auto-assume transfer —
 *    feedback on BITSAT calculus weight might not apply to JEE where
 *    the weight is different. Admin decides. GBrain assists by
 *    surfacing candidate exams (other exams the submitter prepares
 *    for, other exams with the same topic_id).
 *
 * 3. ITERATION CLOSES WHEN ALL FEEDBACK IS IN TERMINAL STATE. The
 *    workflow tracks open vs resolved counts per iteration. A new
 *    iteration opens when admin creates a fresh snapshot after
 *    applying changes.
 *
 * 4. SHAREABLE LINK IS OPAQUE + READ-ONLY. /s/:token returns the
 *    snapshot content + feedback-submission metadata. No auth needed
 *    to view. Feedback submission still requires auth (identified
 *    submitter = non-anonymous = corroboration works).
 */

import type { FeedbackItem, FeedbackTarget } from '../feedback/types';

// ============================================================================
// Sample snapshot — the versioned content unit
// ============================================================================

/**
 * A deep copy of the exam content at the moment of snapshot creation.
 * Identical shape to ExamContent in scope-applicator — but frozen here
 * so later mutations to the live exam content don't affect past samples.
 *
 * Stored as serialized JSON in the flat-file store; on read, parsed
 * back to this shape.
 */
export interface SampleSnapshot {
  exam: any;                            // Full Exam record at snapshot time
  mocks: Array<{ id: string; title: string; questions: any[] }>;
  lessons: Array<{ id: string; components: any[] }>;
  strategies: Array<{ title: string; content: string; evidence: string }>;
}

// ============================================================================
// SampleCheck — the versioned shareable artifact
// ============================================================================

export type SampleCheckStatus =
  | 'open'                              // Accepting feedback
  | 'feedback_review'                   // Admin triaging submitted feedback
  | 'patch_in_flight'                   // Patch proposed, not yet applied
  | 'closed_resolved'                   // All feedback resolved (applied or rejected)
  | 'closed_superseded';                // Admin opened a newer SampleCheck iteration

export interface SampleCheck {
  id: string;                           // "SC-{exam_code}-{base36-timestamp}"
  exam_id: string;                      // Exam this sample is of

  /** Monotonically-increasing per exam_id. 1, 2, 3, ... */
  iteration: number;

  /** Opaque shareable token, used in /s/:token URL. 16-char URL-safe. */
  share_token: string;

  /** Frozen content at snapshot time */
  snapshot: SampleSnapshot;

  /** Admin-facing description of what changed vs prior iteration */
  admin_note: string;

  /** Human-readable title for the share page */
  title: string;                        // e.g. "BITSAT Math sample — iteration 3"

  /** Status lifecycle */
  status: SampleCheckStatus;
  created_at: string;
  created_by: string;                   // admin user_id
  closed_at?: string;
  closed_reason?: string;

  /** Carry-forward lineage — this sample inherits these unresolved feedback ids */
  carry_forward_from_sample_id?: string;

  /**
   * When this sample was superseded by a newer one (closed_superseded),
   * references the new iteration. Lets students following an old link
   * discover the updated version.
   */
  superseded_by_sample_id?: string;

  /** Aggregate feedback counts — updated by sample-check-store.updateStats */
  feedback_stats: {
    total: number;
    open: number;                       // submitted OR triaged
    approved_not_applied: number;
    applied: number;
    rejected: number;
    duplicate: number;
  };
}

// ============================================================================
// Iteration record — lineage tracking
// ============================================================================

/**
 * When a new SampleCheck is created for an exam that already has sample
 * iterations, an Iteration record is written to track the diff + which
 * feedback carried forward.
 */
export interface SampleIteration {
  id: string;                           // "IT-{8-char-nano}"
  exam_id: string;
  from_sample_id?: string;              // null for iteration 1
  to_sample_id: string;
  iteration_number: number;             // Matches to_sample.iteration

  /** Release tag this iteration corresponds to. e.g. "v2.14.1" */
  release_tag?: string;

  /**
   * Carry-forward decisions — admin explicitly reviews each unresolved
   * feedback item from the previous iteration and decides: carry it
   * forward (still applies), resolve as applied (fix landed), or
   * resolve as obsolete (no longer relevant).
   */
  carry_forward_decisions: Array<{
    feedback_id: string;
    decision: 'carried_forward' | 'resolved_applied' | 'resolved_obsolete';
    rationale: string;
  }>;

  /** Summary of ScopePatchOps that produced the new snapshot */
  patch_summary?: string;
  patch_id?: string;

  created_at: string;
  created_by: string;
}

// ============================================================================
// Cross-exam link — explicit relevance across exams
// ============================================================================

/**
 * When admin reviews feedback and recognizes it's relevant to another
 * exam, they create a CrossExamLink. The linked exam's admin sees the
 * feedback on their own dashboard as a "relevant from exam Y" item —
 * they decide independently whether to apply.
 */
export interface CrossExamLink {
  id: string;                           // "CXL-{8-char-nano}"
  source_feedback_id: string;
  source_exam_id: string;
  target_exam_id: string;
  created_by: string;                   // Admin who asserted the cross-link
  created_at: string;
  rationale: string;                    // Why admin thinks this transfers

  /** Status on target exam side — independent of source */
  target_status:
    | 'pending_review'                  // Target exam admin hasn't acted
    | 'acknowledged'                    // Target admin accepted relevance
    | 'declined'                        // Target admin declined
    | 'applied_to_target';              // Change was made on target
  target_reviewed_at?: string;
  target_reviewed_by?: string;
  target_decline_reason?: string;
  target_applied_in_release?: string;

  /**
   * GBrain-suggested vs admin-originated.
   * GBrain surfaces candidate links based on:
   *   (a) submitter prepares for both exams (exam_context)
   *   (b) feedback target topic_id appears in both exams' syllabi
   *   (c) corroboration from students who prepare for target exam
   * Admin still has to accept the suggestion.
   */
  gbrain_suggested: boolean;
  gbrain_signals?: {
    submitter_prepares_for_target?: boolean;
    topic_present_in_both?: boolean;
    target_exam_submitters_also_corroborated?: number;
  };
}

// ============================================================================
// Public view — what students see when they click /s/:token
// ============================================================================

export interface SampleCheckPublicView {
  sample_check_id: string;
  title: string;
  exam_name: string;
  iteration: number;
  status: SampleCheckStatus;
  admin_note: string;

  /** Inlined content — student doesn't need to fetch separately */
  snapshot: SampleSnapshot;

  /** Simple guide */
  how_to_give_feedback: {
    endpoint: string;                   // "/api/sample-check/{id}/feedback"
    feedback_kinds: string[];
    example_body: any;
  };

  /** If this sample was superseded, tell the student */
  newer_version?: {
    sample_check_id: string;
    iteration: number;
    share_token: string;
  };

  /**
   * How many students have given feedback so far. Shown to create
   * a sense of contribution + motivate submission.
   */
  community_stats: {
    students_participated: number;
    feedback_applied_count: number;
  };
}
