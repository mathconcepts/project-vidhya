/**
 * @deprecated Use `getTopicsForExam(examId)` from `src/curriculum/topic-adapter`.
 *
 * This file used to be the single source of truth for "the 10 GATE topics."
 * v2.7 made the platform exam-agnostic at the type-level by routing every
 * topic lookup through `getTopicsForExam(examId)`, which reads from the
 * per-exam YAML syllabus (see `src/curriculum/exam-loader.ts`).
 *
 * Audit (2026-04-30): zero consumers in src/ or frontend/src/. The constants
 * here were already dead code by Phase 2; this file remains only so legacy
 * imports (if any third-party code still references it) get a clear deprecation
 * pointer rather than a missing-module error.
 *
 * REMOVAL TARGET: v3.0 (after one release of grace).
 */

import { getTopicsForExam, getTopicKeywords } from '../curriculum/topic-adapter';

/** @deprecated Use `getTopicsForExam('gate-ma')`. */
export function getGateMathTopicIds(): string[] {
  return getTopicsForExam('gate-ma').map(t => t.id);
}

/** @deprecated Use `getTopicsForExam(examId)` then map to `t.name`. */
export function getGateMathTopicLabels(): Record<string, string> {
  return Object.fromEntries(getTopicsForExam('gate-ma').map(t => [t.id, t.name]));
}

/** @deprecated Use `getTopicsForExam(examId)` then map to `t.icon`. */
export function getGateMathTopicIcons(): Record<string, string> {
  return Object.fromEntries(getTopicsForExam('gate-ma').map(t => [t.id, t.icon]));
}

/** @deprecated Use `getKeywordsForExam(examId)` or `getTopicKeywords(topicId)`. */
export function getGateMathTopicKeywords(): Record<string, string[]> {
  return Object.fromEntries(
    getTopicsForExam('gate-ma').map(t => [t.id, getTopicKeywords(t.id)]),
  );
}
