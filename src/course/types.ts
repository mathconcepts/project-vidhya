// @ts-nocheck
/**
 * Course Types — LiveCourse is the production-grade exam content that
 * students actually consume. It's distinct from SampleCheck (which is
 * versioned pilot content under active feedback collection).
 *
 * Design invariants:
 *
 * 1. SEMVER VERSIONING.
 *      major — breaking structural changes (marking scheme, duration,
 *              total questions, question types)
 *      minor — additive scope (new topics, lessons, mocks)
 *      patch — content fixes from feedback (typos, wrong answers,
 *              weight adjustments, trap edits)
 *    The promoter auto-detects the appropriate bump level by diffing
 *    against the prior version; admin can override.
 *
 * 2. APPEND-ONLY LINEAGE.
 *    PromotionRecord is immutable. Every promotion creates a new
 *    record. Rollback = new promotion of earlier content; the log
 *    still shows both the forward and backward move.
 *
 * 3. CONTENT-ADDRESSED IDEMPOTENCY.
 *    A promotion is uniquely determined by its source_sample_ids
 *    sorted + applied_feedback_ids sorted. Running the same promotion
 *    twice returns the existing record — no duplicate versions.
 *
 * 4. FULL TRACEABILITY.
 *    Any line of content in a LiveCourse can be traced back to:
 *      - which sample iteration it came from
 *      - which student feedback (if any) shaped it
 *      - which release tag applied the feedback
 *      - which admin approved the promotion
 */

import type { SampleSnapshot } from '../sample-check/types';

// ============================================================================

export interface CourseVersion {
  /** Semver string, e.g. "1.2.0" */
  value: string;
  major: number;
  minor: number;
  patch: number;
}

export type CourseStatus =
  | 'draft'                   // Created, not yet published
  | 'published'               // Students actively using this version
  | 'archived'                // Superseded by newer version, still readable
  | 'retracted';              // Pulled for serious error; not student-visible

export type PromotionBumpLevel = 'major' | 'minor' | 'patch';

/**
 * The live, production-grade course. One LiveCourse per exam_id.
 * Multiple versions exist over time; the currently-published one is
 * what students see.
 */
export interface LiveCourse {
  id: string;                              // "LC-{exam_code}"
  exam_id: string;
  exam_name: string;
  exam_code: string;

  /** The currently-published version */
  current_version: CourseVersion;
  current_version_content: SampleSnapshot;

  /** All historical versions (append-only). Newest last. */
  version_history: Array<{
    version: CourseVersion;
    status: CourseStatus;
    published_at: string;
    snapshot: SampleSnapshot;
    /** Pointer to the PromotionRecord that produced this version */
    promotion_record_id: string;
  }>;

  created_at: string;
  created_by: string;
  last_promoted_at: string;
  last_promoted_by: string;
}

// ============================================================================

/**
 * PromotionRecord — immutable audit log entry for each promotion.
 * Every change to any LiveCourse produces exactly one of these.
 */
export interface PromotionRecord {
  id: string;                              // "PR-{8-char-nano}"
  course_id: string;
  exam_id: string;

  /** Content-addressed fingerprint: hash of sources + applied feedback */
  content_hash: string;

  /** Version transition */
  version_before?: CourseVersion;          // undefined for very first promotion
  version_after: CourseVersion;
  bump_level: PromotionBumpLevel;
  bump_auto_detected: PromotionBumpLevel;  // What the diff suggested
  bump_overridden_by_admin: boolean;

  /** Which sample checks contributed content to this version */
  source_sample_ids: string[];
  /** Which specific feedback items were applied (status='applied' subset) */
  applied_feedback_ids: string[];

  /** Human summary — auto-generated release notes */
  summary: string;

  /** Machine-readable diff summary against prior version */
  diff: {
    added_topics: string[];
    removed_topics: string[];
    topic_weight_changes: Array<{ topic_id: string; from: number; to: number }>;
    added_lessons: string[];
    modified_lessons: string[];
    added_mocks: string[];
    modified_mock_questions: Array<{ mock_id: string; question_id: string }>;
    added_strategies: string[];
    edited_strategies: string[];
    metadata_changes: Array<{ field: string; from: any; to: any }>;
  };

  /** Provenance — LLM-generated content mixed into this version */
  generation_provenance_aggregate?: {
    total_cost_usd: number;
    pieces_generated_by_llm: number;
    pieces_verified_by_wolfram: number;
  };

  /** Status — 'success' means version was persisted and is the course current */
  status: 'success' | 'rolled_back';
  rolled_back_at?: string;
  rolled_back_reason?: string;

  promoted_at: string;
  promoted_by: string;                     // admin user_id
  release_tag?: string;                     // e.g. "v2.17.0"
}

// ============================================================================

/**
 * Aggregated traceability view — given a LiveCourse + version, answers:
 *   "Which feedback items shaped this version, from which students,
 *    on which sample iterations, in which releases?"
 *
 * Built on demand from the append-only log; not stored.
 */
export interface LineageView {
  course_id: string;
  version: CourseVersion;
  promotion_record_id: string;
  source_samples: Array<{
    sample_check_id: string;
    iteration: number;
    status: string;
    feedback_count: number;
  }>;
  applied_feedback_items: Array<{
    feedback_id: string;
    kind: string;
    submitted_by: { user_id: string; display_name?: string };
    summary: string;
    applied_in_release?: string;
  }>;
  cross_exam_contributions: Array<{
    cross_link_id: string;
    source_exam_id: string;
    source_feedback_id: string;
    rationale: string;
  }>;
}
