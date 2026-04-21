// @ts-nocheck
/**
 * GBrain Exam Context — exam-aware personalization for content delivery
 *
 * When a student has `exam_id` assigned, GBrain uses exam-specific data
 * to tailor every piece of content it delivers:
 *
 *   - Topic priorities weighted by exam.topic_weights
 *   - Problem generator matches exam.question_types mix
 *   - Mock exams use exam.duration_minutes + exam.marking_scheme
 *   - Countdown prompts when exam.next_attempt_date is set
 *   - Syllabus scoped to exam.syllabus instead of full concept graph
 *   - Difficulty calibrated to exam.level
 *
 * When the student's exam has incomplete data, this module falls back to
 * the nearest-complete match (via findMoreCompleteMatch) — so students
 * still get exam-aware personalization even when the admin is still
 * filling in the exam profile.
 *
 * Following the GBrain Integration Bridge pattern from v2.9.0: pure
 * functions, read-only, opt-in consumption.
 */

import { getUserById } from '../auth/user-store';
import { getExam } from '../exams/exam-store';
import { toCanonical, type CanonicalExam } from '../exams/exam-comparison';
import { findMoreCompleteMatch } from '../exams/exam-similarity';
import type { Exam, MarkingScheme, QuestionTypeMix } from '../exams/types';

// ============================================================================

export interface ExamContext {
  /** The exam this context is for */
  exam_id: string;
  exam_code: string;
  exam_name: string;
  exam_level?: string;

  /** Topic priorities used to weight concept importance in recommendations */
  topic_weights: Record<string, number>;

  /** Topics from exam.syllabus — the scoped universe of relevant concepts */
  syllabus_topic_ids: string[];

  /** Whether syllabus is fully defined */
  has_full_syllabus: boolean;

  /** Structural knobs for problem generation + mock exam assembly */
  marking_scheme?: MarkingScheme;
  question_types?: QuestionTypeMix;
  duration_minutes?: number;
  total_marks?: number;

  /** Schedule — drives countdown prompts + pacing */
  days_to_exam: number | null;
  exam_is_close: boolean;        // < 30 days
  exam_is_imminent: boolean;     // < 7 days
  typical_prep_weeks?: number;

  /** Top-weighted concepts — shortcut for priority ordering */
  priority_concepts: string[];   // top 5 by weight

  /** Whether this context was hydrated from a nearest-match fallback */
  is_fallback: boolean;
  fallback_source_name?: string;

  /** Completeness of the exam's structural data */
  structural_completeness: number;
}

// ============================================================================

const NO_CONTEXT: ExamContext | null = null;

/**
 * Build an ExamContext for a student. Returns null if the student has no
 * exam_id or the exam can't be found. When the exam has sparse structural
 * data, returns a merged context using the nearest-complete match for
 * missing fields.
 */
export async function getExamContextForStudent(user_id: string): Promise<ExamContext | null> {
  const user = getUserById(user_id);
  if (!user || !user.exam_id) return NO_CONTEXT;

  const exam = getExam(user.exam_id);
  if (!exam) return NO_CONTEXT;

  return buildContext(exam);
}

/**
 * Direct hydration from an exam — bypasses the user lookup. Useful for
 * consumers that already have the exam_id.
 */
export function getExamContextForExam(exam_id: string): ExamContext | null {
  const exam = getExam(exam_id);
  if (!exam) return NO_CONTEXT;
  return buildContext(exam);
}

// ============================================================================

function buildContext(exam: Exam): ExamContext {
  const primary = toCanonical(exam);
  let merged: CanonicalExam = primary;
  let is_fallback = false;
  let fallback_source_name: string | undefined;

  // If primary exam has sparse structural data, augment with nearest match
  const primaryStructCompleteness = structuralCompleteness(primary);
  if (primaryStructCompleteness < 0.5) {
    const fallback = findMoreCompleteMatch(primary, 0.4);
    if (fallback) {
      merged = mergeStructural(primary, fallback.full);
      is_fallback = true;
      fallback_source_name = fallback.match.exam_name;
    }
  }

  // Compute countdown
  let days_to_exam: number | null = null;
  if (exam.next_attempt_date) {
    try {
      const examDate = new Date(exam.next_attempt_date).getTime();
      const now = Date.now();
      const ms = examDate - now;
      days_to_exam = Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
    } catch {
      days_to_exam = null;
    }
  }

  // Top priority concepts by weight
  const topic_weights = merged.topic_weights || {};
  const priority_concepts = Object.entries(topic_weights)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([topic]) => topic);

  const syllabus_topic_ids = merged.topics || [];

  return {
    exam_id: exam.id,
    exam_code: exam.code,
    exam_name: exam.name,
    exam_level: exam.level,
    topic_weights,
    syllabus_topic_ids,
    has_full_syllabus: syllabus_topic_ids.length >= 5,
    marking_scheme: merged.marking_scheme,
    question_types: merged.question_types,
    duration_minutes: merged.duration_minutes,
    total_marks: merged.total_marks,
    days_to_exam,
    exam_is_close: days_to_exam !== null && days_to_exam <= 30,
    exam_is_imminent: days_to_exam !== null && days_to_exam <= 7,
    typical_prep_weeks: merged.typical_prep_weeks,
    priority_concepts,
    is_fallback,
    fallback_source_name,
    structural_completeness: structuralCompleteness(merged),
  };
}

function structuralCompleteness(c: CanonicalExam): number {
  let filled = 0;
  let total = 0;
  if (c.topics && c.topics.length > 0) filled += 2;
  total += 2;
  if (c.topic_weights && Object.keys(c.topic_weights).length > 0) filled++;
  total++;
  if (c.duration_minutes) filled++;
  total++;
  if (c.total_marks) filled++;
  total++;
  if (c.marking_scheme) filled++;
  total++;
  if (c.question_types) filled++;
  total++;
  return total > 0 ? filled / total : 0;
}

/**
 * Merge primary's non-null fields over fallback — primary always wins.
 */
function mergeStructural(primary: CanonicalExam, fallback: CanonicalExam): CanonicalExam {
  const mergedTopics = primary.topics && primary.topics.length > 0
    ? primary.topics
    : fallback.topics || [];
  const mergedWeights = primary.topic_weights && Object.keys(primary.topic_weights).length > 0
    ? primary.topic_weights
    : fallback.topic_weights;

  return {
    ...primary,
    topics: mergedTopics,
    topic_weights: mergedWeights,
    duration_minutes: primary.duration_minutes ?? fallback.duration_minutes,
    total_marks: primary.total_marks ?? fallback.total_marks,
    marking_scheme: primary.marking_scheme || fallback.marking_scheme,
    question_types: primary.question_types || fallback.question_types,
    typical_prep_weeks: primary.typical_prep_weeks ?? fallback.typical_prep_weeks,
  };
}

// ============================================================================
// Consumer helpers — small, pure, called from GBrain modules
// ============================================================================

/**
 * Boost a concept's priority based on its weight in the student's target exam.
 * Returns a multiplier in [0.5, 2.0] — applied to base priority.
 *
 * If concept isn't in exam topics → returns 1.0 (neutral).
 * If concept is the exam's top topic → returns close to 2.0.
 */
export function examPriorityBoost(concept_topic: string, ctx: ExamContext | null): number {
  if (!ctx || !ctx.topic_weights) return 1.0;
  const weight = ctx.topic_weights[concept_topic];
  if (typeof weight !== 'number') return 1.0;
  // Map weight (typically 0.03-0.30) to a 0.5-2.0 multiplier
  // Max weight in GATE MA is ~0.25 (calculus) — scale proportionally
  const maxWeight = Math.max(...Object.values(ctx.topic_weights), 0.01);
  const normalized = weight / maxWeight;  // 0..1
  return 0.5 + normalized * 1.5;          // 0.5..2.0
}

/**
 * If a concept is OUT OF SCOPE for the student's exam, returns true.
 * Consumers use this to de-prioritize or skip content outside the syllabus.
 */
export function isConceptInExamScope(concept_topic: string, ctx: ExamContext | null): boolean {
  if (!ctx || !ctx.has_full_syllabus) return true;  // no data → assume in scope
  return ctx.syllabus_topic_ids.includes(concept_topic);
}

/**
 * Human-readable countdown label for UI surfaces.
 * Returns null if no exam date set.
 */
export function examCountdownLabel(ctx: ExamContext | null): string | null {
  if (!ctx || ctx.days_to_exam === null) return null;
  const d = ctx.days_to_exam;
  if (d === 0) return `Your exam is today`;
  if (d === 1) return `1 day to your exam`;
  if (d <= 7) return `${d} days to your exam`;
  if (d <= 30) return `${d} days to go`;
  if (d <= 90) return `${Math.round(d / 7)} weeks to go`;
  return `${Math.round(d / 30)} months to go`;
}

/**
 * Urgency tier for UI styling + messaging.
 * Critical: ≤7d · High: ≤30d · Medium: ≤90d · Low: >90d or null
 */
export function examUrgencyTier(ctx: ExamContext | null): 'critical' | 'high' | 'medium' | 'low' {
  if (!ctx || ctx.days_to_exam === null) return 'low';
  if (ctx.days_to_exam <= 7) return 'critical';
  if (ctx.days_to_exam <= 30) return 'high';
  if (ctx.days_to_exam <= 90) return 'medium';
  return 'low';
}
