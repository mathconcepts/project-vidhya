/**
 * src/scoring/teacher-queue.ts — human-in-the-loop grading queue.
 *
 * Phase 2 of the 100x Blueprint (§3.5, point 6 + D5 / T2). Any
 * descriptive grade with confidence below the threshold lands here
 * rather than going to the student silently. The teacher reviews,
 * confirms or corrects, and the confirmed pair (response → grade)
 * becomes a calibration sample for the LLM judge.
 *
 * Storage: `grading_reviews` table, migration 029.
 *
 * This file is the contract + the pure-function aggregator; the REST
 * surface lands in src/api/admin-grading-routes.ts (follow-up wiring
 * PR — keeps this module dependency-light and testable in isolation).
 */

import type { GradeResult, StudentId, ItemContext } from '../core/interfaces';

export type ReviewStatus = 'pending' | 'confirmed' | 'corrected' | 'dismissed';

export interface GradingReview {
  id: string;
  studentId: StudentId | null;
  itemId: string;
  studentResponse: string;
  /** The grade the rubric grader produced — preserved verbatim. */
  proposedGrade: GradeResult;
  /** Filled in once a teacher reviews. */
  finalGrade?: GradeResult;
  status: ReviewStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  /** Free-text rationale a reviewer attached (used in calibration). */
  reviewerNotes?: string;
}

export interface TeacherQueueRepo {
  enqueue(review: Omit<GradingReview, 'id' | 'createdAt' | 'status'>): Promise<GradingReview>;
  list(opts?: { status?: ReviewStatus; limit?: number }): Promise<GradingReview[]>;
  resolve(
    id: string,
    decision: { status: 'confirmed' | 'corrected' | 'dismissed'; finalGrade?: GradeResult; reviewerId: string; reviewerNotes?: string }
  ): Promise<GradingReview>;
  /** Recent confirmed/corrected pairs — the calibration set the judge prompt is tuned against. */
  calibrationSamples(limit?: number): Promise<GradingReview[]>;
}

// ────────────────────────────────────────────────────────────────────
// Pure-function aggregators (used by the cockpit)
// ────────────────────────────────────────────────────────────────────

export interface QueueHealth {
  pendingCount: number;
  oldestPendingHours: number;
  /** Inter-rater agreement on confirmed reviews — proxy for ICC. */
  agreementRate: number;
  /** Mean per-item marks the reviewer adjusted. */
  meanAdjustmentMarks: number;
}

/**
 * Aggregate health metrics from a sample of reviews. Cheap to compute,
 * deterministic, no I/O. The cockpit calls this every refresh.
 */
export function summarizeQueue(reviews: GradingReview[], now: Date = new Date()): QueueHealth {
  const pending = reviews.filter(r => r.status === 'pending');
  const pendingCount = pending.length;
  const oldestPendingHours = pending.length
    ? Math.max(
        0,
        (now.getTime() -
          Math.min(...pending.map(r => new Date(r.createdAt).getTime()))) /
          3_600_000,
      )
    : 0;

  const resolved = reviews.filter(
    r => r.status === 'confirmed' || r.status === 'corrected'
  );
  const confirmedCount = reviews.filter(r => r.status === 'confirmed').length;
  const agreementRate = resolved.length > 0 ? confirmedCount / resolved.length : 0;

  const adjustments = resolved
    .filter(r => r.finalGrade)
    .map(r => Math.abs((r.finalGrade!.earned ?? 0) - (r.proposedGrade.earned ?? 0)));
  const meanAdjustmentMarks = adjustments.length
    ? adjustments.reduce((s, a) => s + a, 0) / adjustments.length
    : 0;

  return {
    pendingCount,
    oldestPendingHours: Number(oldestPendingHours.toFixed(1)),
    agreementRate: Number(agreementRate.toFixed(3)),
    meanAdjustmentMarks: Number(meanAdjustmentMarks.toFixed(2)),
  };
}

/**
 * Format a one-shot calibration sample for inclusion in the judge prompt.
 * Reviewers' corrections are gold — they're what tune the rubric.
 */
export function formatCalibrationSample(r: GradingReview, item: ItemContext): string {
  const final = r.finalGrade ?? r.proposedGrade;
  const lines = [
    `## Calibration example`,
    `Student response:`,
    r.studentResponse,
    `Grade (out of ${item.maxMarks}):`,
    `  earned: ${final.earned}`,
    `  perCriterion: ${JSON.stringify(final.perCriterion)}`,
  ];
  if (r.reviewerNotes) lines.push(`Reviewer notes: ${r.reviewerNotes}`);
  return lines.join('\n');
}
