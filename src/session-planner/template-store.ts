// @ts-nocheck
/**
 * Plan-template store — recurring session patterns a student saves
 * once and recalls with one tap.
 *
 * Typical templates:
 *   "Morning commute"  —  8 minutes, primary exam
 *   "Weekend deep"     —  60 minutes, multi-exam
 *   "Pre-dinner quick" —  15 minutes, whatever's most overdue
 *
 * The template captures the INPUTS to a plan request (minutes,
 * exam selection strategy) — not the output. Every recall runs the
 * planner fresh so the actions reflect current state.
 *
 * Design:
 *   - Per-student list; 20 templates per student soft cap
 *   - Template captures minutes + which exams to include + any
 *     optional overrides (forced bias, weekly_hours, etc.)
 *   - Schema versioned for future migration tolerance
 */

import { createFlatFileStore } from '../lib/flat-file-store';

export interface PlanTemplate {
  /** Stable id: "TPL-<8 char>" */
  id: string;
  student_id: string;
  /** Student-visible name */
  name: string;
  /** Minutes budget this template plans for */
  minutes_available: number;
  /**
   * Which exams to include when recalled:
   *   'all'            — every exam in the student's profile
   *   'primary'        — just the closest-dated exam
   *   [exam_id, ...]   — explicit subset
   */
  exam_selection: 'all' | 'primary' | string[];
  /** Optional weekly_hours override */
  weekly_hours?: number;
  /** When the template was created (ISO) */
  created_at: string;
  /** When last recalled (ISO). Updated every time the student fires it. */
  last_used_at?: string;
  /** How many times recalled — useful for sorting "most-used first" in UI */
  use_count: number;
}

interface StoreShape {
  templates: PlanTemplate[];
}

const STORE_PATH = '.data/plan-templates.json';
const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ templates: [] }),
});

const MAX_TEMPLATES_PER_STUDENT = 20;

function shortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function createTemplate(
  student_id: string,
  spec: Omit<PlanTemplate, 'id' | 'student_id' | 'created_at' | 'use_count'>,
): PlanTemplate {
  const store = _store.read();
  const existing = store.templates.filter(t => t.student_id === student_id);
  if (existing.length >= MAX_TEMPLATES_PER_STUDENT) {
    throw new Error(`At most ${MAX_TEMPLATES_PER_STUDENT} templates per student`);
  }
  const t: PlanTemplate = {
    id: `TPL-${shortId()}`,
    student_id,
    created_at: new Date().toISOString(),
    use_count: 0,
    ...spec,
  };
  store.templates.push(t);
  _store.write(store);
  return t;
}

export function listTemplatesForStudent(student_id: string): PlanTemplate[] {
  const store = _store.read();
  return store.templates
    .filter(t => t.student_id === student_id)
    .sort((a, b) => b.use_count - a.use_count || b.created_at.localeCompare(a.created_at));
}

export function getTemplate(id: string): PlanTemplate | null {
  return _store.read().templates.find(t => t.id === id) ?? null;
}

export function deleteTemplate(id: string, student_id: string): boolean {
  const store = _store.read();
  const idx = store.templates.findIndex(t => t.id === id);
  if (idx < 0) return false;
  if (store.templates[idx].student_id !== student_id) {
    throw new Error(`Template '${id}' does not belong to student '${student_id}'`);
  }
  store.templates.splice(idx, 1);
  _store.write(store);
  return true;
}

/**
 * Mark a template as used. Called by the plan route when a template
 * is recalled — lets us sort by most-used and surface repeat patterns.
 */
export function markTemplateUsed(id: string): void {
  const store = _store.read();
  const t = store.templates.find(x => x.id === id);
  if (!t) return;
  t.use_count += 1;
  t.last_used_at = new Date().toISOString();
  _store.write(store);
}

/** Test-only reset. */
export function _resetTemplateStore(): void {
  _store.write({ templates: [] });
}
