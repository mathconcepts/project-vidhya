// @ts-nocheck
/**
 * Cross-Exam Coverage — compute a student's per-exam mastery coverage
 *
 * Given a student's mastery vector and an exam's topic list, compute
 * what fraction of the exam's concepts the student has already covered.
 * This enables features like:
 *
 *   - Giveaway banner: "You've already covered 60% of JEE Advanced
 *     concepts through your GATE-CS prep"
 *   - Exam similarity: rank suggested exams by student readiness
 *   - Cohort analytics: teacher dashboards showing per-exam progress
 *
 * Pure functions. No I/O. No side effects.
 *
 * A topic is considered "covered" when the student's mastery score is
 * >= COVERAGE_THRESHOLD (default 0.5). Concepts with fewer than
 * MIN_ATTEMPTS attempts are excluded from the covered count — a single
 * lucky correct answer doesn't count as coverage.
 */

import type { StudentModel } from './student-model';
import { ALL_CONCEPTS } from '../constants/concept-graph';

const COVERAGE_THRESHOLD = 0.5;   // score at which a concept counts as covered
const MASTERY_THRESHOLD = 0.8;    // score at which a concept counts as mastered
const MIN_ATTEMPTS = 2;           // minimum attempts before a score counts

// ============================================================================

export interface CoverageReport {
  /** How many of this exam's topics the student has attempted at all */
  attempted_count: number;
  /** How many have score >= 0.5 with >= 2 attempts */
  covered_count: number;
  /** How many have score >= 0.8 with >= 2 attempts */
  mastered_count: number;
  /** Total topics in the exam's scope */
  total_count: number;
  /** covered_count / total_count, 0..1 */
  coverage_percent: number;
  /** mastered_count / total_count, 0..1 */
  mastery_percent: number;
  /** Concepts the student has covered (up to 5, for display) */
  covered_preview: string[];
  /** Concepts the student hasn't touched yet (up to 5, for "what's left") */
  untouched_preview: string[];
}

const EMPTY_REPORT: CoverageReport = {
  attempted_count: 0,
  covered_count: 0,
  mastered_count: 0,
  total_count: 0,
  coverage_percent: 0,
  mastery_percent: 0,
  covered_preview: [],
  untouched_preview: [],
};

/**
 * Resolve an exam's topic list into individual concept_ids by walking
 * the concept graph. An exam "topic" (e.g. "linear-algebra") expands
 * into all concept_ids that belong to that topic.
 */
function expandTopicsToConceptIds(topics: string[]): string[] {
  if (!topics || topics.length === 0) return [];
  const topicSet = new Set(topics);
  const conceptIds: string[] = [];
  for (const concept of ALL_CONCEPTS) {
    if (!concept) continue;
    const conceptTopic = (concept as any).topic;
    if (conceptTopic && topicSet.has(conceptTopic)) {
      conceptIds.push((concept as any).id);
    }
  }
  return conceptIds;
}

/**
 * Compute coverage for a student against any list of exam topics.
 *
 * @param model   Student's current model (null → empty report)
 * @param topics  Topic ids (from exam.syllabus_topic_ids or similar)
 * @returns       Coverage report with preview concept ids
 */
export function computeCoverage(
  model: StudentModel | null,
  topics: string[],
): CoverageReport {
  if (!model || !topics || topics.length === 0) {
    return { ...EMPTY_REPORT, total_count: topics?.length || 0 };
  }

  const conceptIds = expandTopicsToConceptIds(topics);
  if (conceptIds.length === 0) {
    return { ...EMPTY_REPORT, total_count: 0 };
  }

  let attempted = 0;
  let covered = 0;
  let mastered = 0;
  const coveredIds: string[] = [];
  const untouchedIds: string[] = [];
  const vec = model.mastery_vector || {};

  for (const cid of conceptIds) {
    const entry = vec[cid];
    if (!entry || !entry.attempts) {
      untouchedIds.push(cid);
      continue;
    }
    attempted++;
    if (entry.attempts >= MIN_ATTEMPTS) {
      if (entry.score >= COVERAGE_THRESHOLD) {
        covered++;
        coveredIds.push(cid);
      }
      if (entry.score >= MASTERY_THRESHOLD) {
        mastered++;
      }
    }
  }

  const total = conceptIds.length;
  return {
    attempted_count: attempted,
    covered_count: covered,
    mastered_count: mastered,
    total_count: total,
    coverage_percent: total > 0 ? covered / total : 0,
    mastery_percent: total > 0 ? mastered / total : 0,
    covered_preview: coveredIds.slice(0, 5),
    untouched_preview: untouchedIds.slice(0, 5),
  };
}

/**
 * Batch version — compute coverage across many exams at once.
 * Used by the giveaway banner to rank bonus exams by student readiness.
 */
export function computeMultiExamCoverage(
  model: StudentModel | null,
  exams: Array<{ id: string; topics: string[] }>,
): Record<string, CoverageReport> {
  const out: Record<string, CoverageReport> = {};
  for (const exam of exams) {
    out[exam.id] = computeCoverage(model, exam.topics);
  }
  return out;
}

/**
 * Human-readable label for a coverage report. Used by UI surfaces.
 */
export function coverageLabel(report: CoverageReport): string {
  const pct = Math.round(report.coverage_percent * 100);
  if (report.total_count === 0) return 'scope undefined';
  if (pct === 0 && report.attempted_count === 0) return 'not started';
  if (pct === 0) return 'getting warmed up';
  if (pct < 20) return `${pct}% covered`;
  if (pct < 50) return `${pct}% covered — getting there`;
  if (pct < 80) return `${pct}% covered — strong start`;
  if (pct < 100) return `${pct}% covered — nearly ready`;
  return '100% covered — ready';
}

/**
 * Urgency/readiness tier for UI styling + messaging.
 *   - unstarted:  0 attempts anywhere in scope
 *   - warming:    some attempts but <20% coverage
 *   - progressing: 20-49% coverage
 *   - strong:     50-79% coverage
 *   - ready:      80%+ coverage
 */
export function coverageTier(
  report: CoverageReport,
): 'unstarted' | 'warming' | 'progressing' | 'strong' | 'ready' {
  if (report.attempted_count === 0) return 'unstarted';
  const pct = report.coverage_percent;
  if (pct < 0.2) return 'warming';
  if (pct < 0.5) return 'progressing';
  if (pct < 0.8) return 'strong';
  return 'ready';
}
