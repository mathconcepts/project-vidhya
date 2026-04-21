// @ts-nocheck
/**
 * Exam Group Store — master list of approved exam bundles
 *
 * An admin can group related exams so that students assigned to one
 * automatically get access to all others in the same approved group.
 * This is the "one subscription, multiple exams" giveaway mechanic.
 *
 * Storage: .data/exam-groups.json via shared createFlatFileStore.
 *
 * Approval invariant: is_approved gates student-facing behavior.
 * Drafts are admin-only — never surfaced to students. This protects
 * students from confusing half-baked groups.
 */

import { createFlatFileStore } from '../lib/flat-file-store';
import type { ExamGroup, ExamGroupSeed } from './types';
import { getExam } from './exam-store';
import { EXAMS as STATIC_EXAMS } from '../syllabus/exam-catalog';

interface ExamGroupRegistry {
  version: 1;
  groups: Record<string, ExamGroup>;
}

const store = createFlatFileStore<ExamGroupRegistry>({
  path: '.data/exam-groups.json',
  defaultShape: () => ({ version: 1, groups: {} }),
});

// ============================================================================
// Unique ID
// ============================================================================

export function generateGroupId(code: string): string {
  const safe = code
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 16) || 'GROUP';
  const ts = Date.now().toString(36).toUpperCase();
  return `GRP-${safe}-${ts}`;
}

// ============================================================================
// CRUD
// ============================================================================

export function createGroup(seed: ExamGroupSeed, admin_user_id: string): ExamGroup {
  const id = generateGroupId(seed.code);
  const nowIso = new Date().toISOString();

  const group: ExamGroup = {
    id,
    code: seed.code,
    name: seed.name,
    description: seed.description,
    exam_ids: seed.exam_ids || [],
    static_exam_ids: seed.static_exam_ids || [],
    is_approved: false,   // starts as draft
    tagline: seed.tagline,
    benefits: seed.benefits,
    created_by: admin_user_id,
    created_at: nowIso,
    updated_at: nowIso,
    is_archived: false,
  };

  store.update(state => { state.groups[id] = group; });
  return group;
}

export function getGroup(id: string): ExamGroup | null {
  return store.read().groups[id] || null;
}

export function listGroups(options: {
  include_archived?: boolean;
  only_approved?: boolean;
} = {}): ExamGroup[] {
  const all = Object.values(store.read().groups);
  return all
    .filter(g => options.include_archived || !g.is_archived)
    .filter(g => !options.only_approved || g.is_approved)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function updateGroup(params: {
  id: string;
  updates: Partial<ExamGroup>;
}): ExamGroup | null {
  const nowIso = new Date().toISOString();
  let updated: ExamGroup | null = null;

  store.update(state => {
    const current = state.groups[params.id];
    if (!current) return;
    const merged: ExamGroup = {
      ...current,
      ...params.updates,
      id: current.id,              // immutable
      created_at: current.created_at,
      created_by: current.created_by,
      updated_at: nowIso,
    };
    state.groups[params.id] = merged;
    updated = merged;
  });

  return updated;
}

export function deleteGroup(id: string): boolean {
  let existed = false;
  store.update(state => {
    if (state.groups[id]) {
      delete state.groups[id];
      existed = true;
    }
  });
  return existed;
}

// ============================================================================
// Approval gate — the security boundary for student-facing activation
// ============================================================================

export function approveGroup(id: string, admin_user_id: string): ExamGroup | null {
  return updateGroup({
    id,
    updates: {
      is_approved: true,
      approved_by: admin_user_id,
      approved_at: new Date().toISOString(),
    } as any,
  });
}

export function unapproveGroup(id: string): ExamGroup | null {
  return updateGroup({
    id,
    updates: {
      is_approved: false,
      approved_by: undefined,
      approved_at: undefined,
    } as any,
  });
}

export function archiveGroup(id: string, archived = true): ExamGroup | null {
  return updateGroup({
    id,
    updates: { is_archived: archived } as any,
  });
}

// ============================================================================
// Membership helpers
// ============================================================================

export function addExamToGroup(group_id: string, exam_id: string, is_static = false): ExamGroup | null {
  const group = getGroup(group_id);
  if (!group) return null;
  if (is_static) {
    const current = group.static_exam_ids || [];
    if (current.includes(exam_id)) return group;
    return updateGroup({ id: group_id, updates: { static_exam_ids: [...current, exam_id] } });
  }
  if (group.exam_ids.includes(exam_id)) return group;
  return updateGroup({ id: group_id, updates: { exam_ids: [...group.exam_ids, exam_id] } });
}

export function removeExamFromGroup(group_id: string, exam_id: string): ExamGroup | null {
  const group = getGroup(group_id);
  if (!group) return null;
  return updateGroup({
    id: group_id,
    updates: {
      exam_ids: group.exam_ids.filter(id => id !== exam_id),
      static_exam_ids: (group.static_exam_ids || []).filter(id => id !== exam_id),
    },
  });
}

/**
 * Resolve all the actual exam entities referenced by a group.
 * Non-existent references are silently skipped (tolerate stale IDs).
 */
export function resolveGroupMembers(group: ExamGroup) {
  const dynamicMembers = group.exam_ids
    .map(id => getExam(id))
    .filter(Boolean);
  const staticMembers = (group.static_exam_ids || [])
    .map(id => (STATIC_EXAMS as any)[id])
    .filter(Boolean);
  return { dynamicMembers, staticMembers };
}

// ============================================================================
// Giveaway resolution — the student-facing lookup
// ============================================================================

export interface GiveawayInfo {
  /** The group the student belongs to via their target exam */
  group_id: string;
  group_name: string;
  group_code: string;
  tagline?: string;
  benefits?: string[];
  description?: string;
  /** The student's primary exam (they're assigned to this one) */
  primary_exam: {
    id: string;
    code: string;
    name: string;
    source: 'dynamic' | 'static';
  };
  /** Other exams in the group — the "giveaway" */
  bonus_exams: Array<{
    id: string;
    code: string;
    name: string;
    source: 'dynamic' | 'static';
    completeness?: number;
  }>;
}

/**
 * Given a student's assigned exam_id, return giveaway info if the exam
 * is a member of any APPROVED group. Returns null if no approved group
 * contains this exam.
 *
 * This is the only function students (indirectly) call — the approval
 * invariant is enforced here.
 */
export function resolveGiveaway(student_exam_id: string): GiveawayInfo | null {
  if (!student_exam_id) return null;

  const approved = listGroups({ only_approved: true });

  for (const group of approved) {
    // Find which group (if any) contains this exam
    const inDynamic = group.exam_ids.includes(student_exam_id);
    const inStatic = (group.static_exam_ids || []).includes(student_exam_id);
    if (!inDynamic && !inStatic) continue;

    // Resolve primary + bonus exams
    let primary: GiveawayInfo['primary_exam'];
    const bonus: GiveawayInfo['bonus_exams'] = [];

    if (inDynamic) {
      const e = getExam(student_exam_id);
      if (!e) continue;
      primary = { id: e.id, code: e.code, name: e.name, source: 'dynamic' };
    } else {
      const s = (STATIC_EXAMS as any)[student_exam_id];
      if (!s) continue;
      primary = { id: s.id, code: s.id, name: s.name, source: 'static' };
    }

    for (const oid of group.exam_ids) {
      if (oid === student_exam_id) continue;
      const e = getExam(oid);
      if (e) {
        bonus.push({
          id: e.id, code: e.code, name: e.name,
          source: 'dynamic', completeness: e.completeness,
        });
      }
    }
    for (const oid of group.static_exam_ids || []) {
      if (oid === student_exam_id) continue;
      const s = (STATIC_EXAMS as any)[oid];
      if (s) {
        bonus.push({ id: s.id, code: s.id, name: s.name, source: 'static' });
      }
    }

    if (bonus.length === 0) continue; // group of one — skip

    return {
      group_id: group.id,
      group_name: group.name,
      group_code: group.code,
      tagline: group.tagline,
      benefits: group.benefits,
      description: group.description,
      primary_exam: primary,
      bonus_exams: bonus,
    };
  }

  return null;
}

/**
 * List all groups that contain a given exam — admin lookup helper.
 * Returns both approved and unapproved groups; drafts appear too for
 * admin context.
 */
export function findGroupsContaining(exam_id: string): ExamGroup[] {
  return listGroups({ include_archived: false }).filter(g =>
    g.exam_ids.includes(exam_id) || (g.static_exam_ids || []).includes(exam_id)
  );
}
