// @ts-nocheck
/**
 * Exam Store — persistent storage for admin-defined exams
 *
 * Uses the shared createFlatFileStore generic from v2.9.1. All exams for
 * this Vidhya instance live in a single .data/exams.json file. Unique ID
 * is generated on creation and is stable across re-enrichment.
 *
 * Design notes:
 *   - Every field is optional except id/code/name/level (the seed)
 *   - Completeness is computed on read, not stored — always fresh
 *   - Provenance is stored alongside the field, so an admin editing a
 *     web-researched value automatically changes its source to admin_manual
 *   - local_data is append-only; old entries can be deleted explicitly
 *   - Archived exams are hidden from default list but preserved
 */

import { createFlatFileStore } from '../lib/flat-file-store';
import type {
  Exam,
  ExamCreateSeed,
  LocalDataEntry,
  FieldProvenance,
  ProvenanceMap,
} from './types';
import { COMPLETENESS_FIELDS, TOTAL_COMPLETENESS_WEIGHT } from './types';

interface ExamRegistry {
  version: 1;
  exams: Record<string, Exam>;
}

const store = createFlatFileStore<ExamRegistry>({
  path: '.data/exams.json',
  defaultShape: () => ({ version: 1, exams: {} }),
});

// ============================================================================
// Unique ID generation
// ============================================================================

/**
 * Generates an exam ID of the form: EXM-<code-safe>-<base36-timestamp>
 *
 * Example: EXM-GATECS2027-MO8JEJYV
 *
 * The code segment makes the ID readable/recognizable; the timestamp
 * segment guarantees uniqueness even if the admin tries to re-create an
 * exam with the same code.
 */
export function generateExamId(code: string): string {
  const safe = code
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 16) || 'EXAM';
  const ts = Date.now().toString(36).toUpperCase();
  return `EXM-${safe}-${ts}`;
}

// ============================================================================
// Completeness scoring
// ============================================================================

function isFieldFilled(exam: Exam, path: string): boolean {
  const v: any = (exam as any)[path];
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  if (typeof v === 'number') return true;
  return Boolean(v);
}

export function computeCompleteness(exam: Exam): number {
  let filled = 0;
  for (const cat of COMPLETENESS_FIELDS) {
    for (const field of cat.fields) {
      if (typeof field.path === 'string' && isFieldFilled(exam, field.path)) {
        filled += field.weight;
      }
    }
  }
  return Math.min(1, filled / TOTAL_COMPLETENESS_WEIGHT);
}

/**
 * Returns a human-readable breakdown of what's filled and what's missing,
 * grouped by category. Used by the admin UI to show "4/7 structural
 * fields filled".
 */
export function getCompletenessBreakdown(exam: Exam) {
  return COMPLETENESS_FIELDS.map(cat => ({
    category: cat.category,
    filled: cat.fields.filter(f =>
      typeof f.path === 'string' && isFieldFilled(exam, f.path)
    ).length,
    total: cat.fields.length,
    missing_fields: cat.fields
      .filter(f => typeof f.path === 'string' && !isFieldFilled(exam, f.path))
      .map(f => f.label),
  }));
}

// ============================================================================
// CRUD
// ============================================================================

export function createExam(seed: ExamCreateSeed, admin_user_id: string): Exam {
  const id = generateExamId(seed.code);
  const nowIso = new Date().toISOString();

  const provenance: ProvenanceMap = {
    code: { source: 'admin_manual', filled_at: nowIso },
    name: { source: 'admin_manual', filled_at: nowIso },
    level: { source: 'admin_manual', filled_at: nowIso },
  };
  if (seed.country) provenance.country = { source: 'admin_manual', filled_at: nowIso };
  if (seed.issuing_body) provenance.issuing_body = { source: 'admin_manual', filled_at: nowIso };
  if (seed.description) provenance.description = { source: 'admin_manual', filled_at: nowIso };
  if (seed.official_url) provenance.official_url = { source: 'admin_manual', filled_at: nowIso };

  const exam: Exam = {
    id,
    code: seed.code,
    name: seed.name,
    level: seed.level,
    country: seed.country,
    issuing_body: seed.issuing_body,
    description: seed.description,
    official_url: seed.official_url,
    local_data: seed.seed_text ? [{
      id: 'local_' + Math.random().toString(36).slice(2, 10),
      kind: 'text',
      title: 'Initial seed text',
      content: seed.seed_text,
      uploaded_at: nowIso,
      uploaded_by: admin_user_id,
    }] : [],
    provenance,
    completeness: 0,
    created_by: admin_user_id,
    created_at: nowIso,
    updated_at: nowIso,
    is_draft: true,
    is_archived: false,
  };

  exam.completeness = computeCompleteness(exam);

  store.update(state => { state.exams[id] = exam; });
  return exam;
}

export function getExam(id: string): Exam | null {
  const e = store.read().exams[id];
  if (!e) return null;
  return { ...e, completeness: computeCompleteness(e) };
}

export function listExams(options: { include_archived?: boolean; include_drafts?: boolean } = {}): Exam[] {
  const all = Object.values(store.read().exams);
  return all
    .filter(e => options.include_archived || !e.is_archived)
    .filter(e => options.include_drafts !== false || !e.is_draft)
    .map(e => ({ ...e, completeness: computeCompleteness(e) }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

/**
 * Update an exam's fields with explicit provenance tracking. When an admin
 * edits a web-researched field, its provenance automatically flips to
 * admin_manual (higher trust).
 */
export function updateExam(params: {
  id: string;
  updates: Partial<Exam>;
  source: FieldProvenance['source'];
  confidence?: number;
  notes?: string;
}): Exam | null {
  const nowIso = new Date().toISOString();
  let updated: Exam | null = null;

  store.update(state => {
    const current = state.exams[params.id];
    if (!current) return;

    // Track provenance for each field that was actually updated
    const newProvenance = { ...current.provenance };
    for (const key of Object.keys(params.updates)) {
      // Skip meta fields
      if (['id', 'created_at', 'created_by', 'provenance', 'local_data', 'completeness'].includes(key)) continue;
      newProvenance[key] = {
        source: params.source,
        filled_at: nowIso,
        confidence: params.confidence,
        notes: params.notes,
      };
    }

    const merged: Exam = {
      ...current,
      ...params.updates,
      id: current.id,
      created_at: current.created_at,
      created_by: current.created_by,
      local_data: current.local_data,
      provenance: newProvenance,
      updated_at: nowIso,
      last_enriched_at: params.source === 'web_research' ? nowIso : current.last_enriched_at,
    };
    merged.completeness = computeCompleteness(merged);

    state.exams[params.id] = merged;
    updated = merged;
  });

  return updated;
}

export function deleteExam(id: string): boolean {
  let existed = false;
  store.update(state => {
    if (state.exams[id]) {
      delete state.exams[id];
      existed = true;
    }
  });
  return existed;
}

export function archiveExam(id: string, archived = true): Exam | null {
  return updateExam({
    id,
    updates: { is_archived: archived } as any,
    source: 'admin_manual',
  });
}

export function markReady(id: string): Exam | null {
  return updateExam({
    id,
    updates: { is_draft: false } as any,
    source: 'admin_manual',
  });
}

// ============================================================================
// Local data management
// ============================================================================

export function addLocalData(params: {
  exam_id: string;
  kind: LocalDataEntry['kind'];
  title: string;
  content: string;
  admin_user_id: string;
}): LocalDataEntry | null {
  const entry: LocalDataEntry = {
    id: 'local_' + Math.random().toString(36).slice(2, 10),
    kind: params.kind,
    title: params.title,
    content: params.content,
    uploaded_at: new Date().toISOString(),
    uploaded_by: params.admin_user_id,
  };

  let ok = false;
  store.update(state => {
    const exam = state.exams[params.exam_id];
    if (!exam) return;
    exam.local_data.push(entry);
    exam.updated_at = new Date().toISOString();
    ok = true;
  });

  return ok ? entry : null;
}

export function removeLocalData(exam_id: string, entry_id: string): boolean {
  let removed = false;
  store.update(state => {
    const exam = state.exams[exam_id];
    if (!exam) return;
    const before = exam.local_data.length;
    exam.local_data = exam.local_data.filter(e => e.id !== entry_id);
    if (exam.local_data.length < before) {
      removed = true;
      exam.updated_at = new Date().toISOString();
    }
  });
  return removed;
}

// ============================================================================
// Student assignment — returns exams available to assign
// ============================================================================

export function getAssignableExams(): Exam[] {
  return listExams({ include_drafts: false });
}

export function getExamByCode(code: string): Exam | null {
  const all = store.read().exams;
  const match = Object.values(all).find(e => e.code === code && !e.is_archived);
  if (!match) return null;
  return { ...match, completeness: computeCompleteness(match) };
}
