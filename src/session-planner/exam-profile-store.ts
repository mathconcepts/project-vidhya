// @ts-nocheck
/**
 * Student exam-profile store — where a student declares which exams
 * they are actively preparing for and the dates of each.
 *
 * This is the data the session planner reads to turn "plan me a
 * session" into "plan me a session across MY exams" without the
 * student having to re-enter exam_id and exam_date on every call.
 *
 * Design:
 *   - One record per student_id (keyed map, not append-only)
 *   - Each record has 0-5 ExamRegistration entries
 *   - Writes upsert the whole record — simpler and race-safe enough
 *     for the realistic workload (students change their profile
 *     maybe once a month)
 *   - Flat-file store matching the other persistence modules; no new
 *     dependencies, no schema migrations.
 */

import { createFlatFileStore } from '../lib/flat-file-store';

export interface ExamRegistration {
  exam_id: string;
  exam_date: string;              // ISO date (YYYY-MM-DD)
  weekly_hours?: number;
  topic_confidence?: Record<string, number>;  // 1-5 per topic
  /**
   * Optional knowledge track that led the student to register this
   * exam — e.g. 'CBSE-12-MATH'. When set, the planner and GBrain can
   * personalize against the student's school curriculum context.
   * See src/knowledge/tracks.ts.
   */
  knowledge_track_id?: string;
  /**
   * Preparation intent — shapes content scoping across the whole stack
   * (system prompts, bridge recommendations, scraping/generation prompts).
   *
   *   'board-focused'    — student's primary goal is the school board exam.
   *                        Don't bring in entrance-exam references unless
   *                        the student explicitly asks for them.
   *   'bridge'           — preparing for both board AND entrance.
   *                        Surface bridge content proactively. (Default
   *                        when knowledge_track_id is set alongside an
   *                        entrance exam.)
   *   'entrance-focused' — primary goal is entrance exam. School syllabus
   *                        only matters as a foundation reference. Generate
   *                        and surface depth-gap / breadth-gap content.
   *
   * When omitted, the system infers from context (see derivePrepIntent).
   */
  prep_intent?: 'board-focused' | 'bridge' | 'entrance-focused';
  /** When the student added this exam — informational */
  added_at: string;
}

/**
 * Derive a sensible prep_intent when one wasn't explicitly chosen.
 *
 * Rules:
 *   - knowledge_track_id present (school student) AND exam is a major
 *     entrance exam (JEE/BITSAT/UGEE/NEET) -> 'bridge'
 *   - knowledge_track_id present but no entrance-exam-like target ->
 *     'board-focused' (they're in school, no entrance signal)
 *   - no knowledge_track_id at all -> 'entrance-focused' (they came in
 *     through the exam picker; assume they want entrance-level)
 */
export function derivePrepIntent(reg: ExamRegistration): 'board-focused' | 'bridge' | 'entrance-focused' {
  if (reg.prep_intent) return reg.prep_intent;
  const isEntranceExam = /JEE|BITSAT|UGEE|NEET|GATE/i.test(reg.exam_id);
  if (reg.knowledge_track_id && isEntranceExam) return 'bridge';
  if (reg.knowledge_track_id) return 'board-focused';
  return 'entrance-focused';
}

export interface StudentExamProfile {
  student_id: string;
  exams: ExamRegistration[];
  updated_at: string;
}

interface StoreShape {
  profiles: StudentExamProfile[];
}

const STORE_PATH = '.data/student-exam-profiles.json';
const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ profiles: [] }),
});

// ============================================================================

export function getProfile(student_id: string): StudentExamProfile | null {
  const store = _store.read();
  return store.profiles.find(p => p.student_id === student_id) ?? null;
}

export function upsertProfile(student_id: string, exams: ExamRegistration[]): StudentExamProfile {
  if (exams.length > 5) {
    throw new Error('A student can register at most 5 concurrent exams');
  }
  // Deduplicate by exam_id — last-write-wins inside the array itself.
  const seen = new Set<string>();
  const deduped: ExamRegistration[] = [];
  for (const e of exams) {
    if (seen.has(e.exam_id)) continue;
    seen.add(e.exam_id);
    deduped.push(e);
  }

  const store = _store.read();
  const idx = store.profiles.findIndex(p => p.student_id === student_id);
  const now = new Date().toISOString();
  const record: StudentExamProfile = {
    student_id,
    exams: deduped,
    updated_at: now,
  };
  if (idx < 0) store.profiles.push(record);
  else store.profiles[idx] = record;
  _store.write(store);
  return record;
}

export function addExam(student_id: string, exam: ExamRegistration): StudentExamProfile {
  const existing = getProfile(student_id);
  const exams = existing?.exams.filter(e => e.exam_id !== exam.exam_id) ?? [];
  exams.push(exam);
  return upsertProfile(student_id, exams);
}

export function removeExam(student_id: string, exam_id: string): StudentExamProfile {
  const existing = getProfile(student_id);
  if (!existing) return { student_id, exams: [], updated_at: new Date().toISOString() };
  const exams = existing.exams.filter(e => e.exam_id !== exam_id);
  return upsertProfile(student_id, exams);
}

/** Test-only reset. */
export function _resetExamProfileStore(): void {
  _store.write({ profiles: [] });
}
