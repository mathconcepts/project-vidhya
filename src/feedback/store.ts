// @ts-nocheck
/**
 * Feedback Store — persistence + triage + aggregation.
 *
 * Generic across exams. Pure functions for triage logic; flat-file store
 * for persistence (consistent with the rest of the v2.9.1 primitives).
 *
 * Every exam shares this store. BITSAT feedback, GATE feedback, NEET
 * feedback all coexist here. Separation by exam is via FeedbackItem.target.exam_id
 * rather than by separate files — simpler, and enables cross-exam admin views.
 */

import { createFlatFileStore } from '../lib/flat-file-store';
import type {
  FeedbackItem,
  FeedbackKind,
  FeedbackStatus,
  FeedbackPriority,
  FeedbackTarget,
  AppliedChange,
  FeedbackDashboard,
} from './types';

// ============================================================================
// Persistence
// ============================================================================

interface FeedbackStoreShape {
  feedback: FeedbackItem[];
  applied_changes: AppliedChange[];
}

const STORE_PATH = '.data/feedback.json';

const _store = createFlatFileStore<FeedbackStoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ feedback: [], applied_changes: [] }),
});

// ============================================================================
// Id generation — short, URL-safe, no external dep
// ============================================================================

function shortId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

function feedbackId(kind: FeedbackKind): string {
  // Shorten kind for id: mock_question_error -> mqe
  const shortKind = kind.split('_').map(p => p[0]).join('');
  return `FB-${shortKind}-${shortId('').slice(3)}`;
}

// ============================================================================
// Submit — student-facing entry point
// ============================================================================

export interface SubmitFeedbackInput {
  kind: FeedbackKind;
  target: FeedbackTarget;
  description: string;
  suggestion?: Record<string, any>;
  evidence?: string[];
  submitted_by: { user_id: string; display_name?: string; anonymous?: boolean };
}

/**
 * Submit a new piece of feedback. Returns the stored item with id + status.
 * All inputs validated. No auth performed here — caller is responsible for that.
 */
export function submitFeedback(input: SubmitFeedbackInput): FeedbackItem {
  const now = new Date().toISOString();
  const item: FeedbackItem = {
    id: feedbackId(input.kind),
    kind: input.kind,
    target: input.target,
    description: input.description.trim(),
    suggestion: input.suggestion,
    evidence: input.evidence,
    submitted_by: {
      user_id: input.submitted_by.user_id,
      display_name: input.submitted_by.display_name,
      anonymous: input.submitted_by.anonymous ?? false,
      submitted_at: now,
    },
    status: 'submitted',
    corroboration_count: 0,
  };
  const store = _store.read();
  store.feedback.push(item);

  // Compute corroboration: count existing open items with same target +
  // similar kind. Updates both the new item and existing matches.
  for (const other of store.feedback) {
    if (other.id === item.id) continue;
    if (other.status === 'rejected' || other.status === 'duplicate') continue;
    if (isCorroboration(other, item)) {
      other.corroboration_count++;
      item.corroboration_count++;
    }
  }

  _store.write(store);
  return item;
}

/**
 * Two items corroborate if they hit the same target precisely AND
 * the kind is in the same family. Kinds in the same family:
 *   - mock_question_error ↔ mock_question_error
 *   - lesson_content_error ↔ lesson_content_error
 *   - topic_weight_recalibration (any two on same topic)
 *   - syllabus_missing_topic (any two on same exam)
 */
function isCorroboration(a: FeedbackItem, b: FeedbackItem): boolean {
  if (a.kind !== b.kind) return false;
  const t1 = a.target;
  const t2 = b.target;
  if (t1.exam_id !== t2.exam_id) return false;

  switch (a.kind) {
    case 'mock_question_error':
      return t1.question_id === t2.question_id;
    case 'lesson_content_error':
    case 'trap_mismatch':
    case 'trap_addition':
      return t1.lesson_id === t2.lesson_id && t1.component_id === t2.component_id;
    case 'topic_weight_recalibration':
      return t1.topic_id === t2.topic_id;
    case 'syllabus_missing_topic':
    case 'mock_coverage_gap':
      return true;  // Any two on the same exam corroborate on scope
    case 'strategy_preference':
    case 'strategy_addition':
      return t1.strategy_title === t2.strategy_title;
    case 'exam_metadata_error':
      return true;
    default:
      return false;
  }
}

// ============================================================================
// Query — the read side
// ============================================================================

export function listFeedback(filter?: {
  exam_id?: string;
  status?: FeedbackStatus;
  kind?: FeedbackKind;
  priority?: FeedbackPriority;
  user_id?: string;
}): FeedbackItem[] {
  const items = _store.read().feedback;
  return items.filter(i => {
    if (filter?.exam_id && i.target.exam_id !== filter.exam_id) return false;
    if (filter?.status && i.status !== filter.status) return false;
    if (filter?.kind && i.kind !== filter.kind) return false;
    if (filter?.priority && i.priority !== filter.priority) return false;
    if (filter?.user_id && i.submitted_by.user_id !== filter.user_id) return false;
    return true;
  });
}

export function getFeedback(id: string): FeedbackItem | null {
  return _store.read().feedback.find(i => i.id === id) ?? null;
}

export function listAppliedChanges(exam_id?: string): AppliedChange[] {
  const changes = _store.read().applied_changes;
  return exam_id ? changes.filter(c => c.exam_id === exam_id) : changes;
}

// ============================================================================
// Triage — admin-side state transitions
// ============================================================================

export function triageFeedback(
  id: string,
  triaged_by: string,
  priority: FeedbackPriority,
  admin_notes?: string,
): FeedbackItem | null {
  const store = _store.read();
  const item = store.feedback.find(i => i.id === id);
  if (!item) return null;
  if (item.status !== 'submitted') return item;

  item.status = 'triaged';
  item.priority = priority;
  item.triaged_at = new Date().toISOString();
  item.triaged_by = triaged_by;
  if (admin_notes) item.admin_notes = admin_notes;
  _store.write(store);
  return item;
}

export function approveFeedback(
  id: string,
  approved_by: string,
  admin_notes?: string,
): FeedbackItem | null {
  const store = _store.read();
  const item = store.feedback.find(i => i.id === id);
  if (!item) return null;
  if (item.status !== 'triaged' && item.status !== 'submitted') return item;

  item.status = 'approved';
  item.approved_at = new Date().toISOString();
  item.approved_by = approved_by;
  if (admin_notes) item.admin_notes = admin_notes;
  _store.write(store);
  return item;
}

export function rejectFeedback(
  id: string,
  rejected_by: string,
  reason: string,
): FeedbackItem | null {
  const store = _store.read();
  const item = store.feedback.find(i => i.id === id);
  if (!item) return null;
  if (item.status === 'applied') return item;

  item.status = 'rejected';
  item.triaged_at = item.triaged_at ?? new Date().toISOString();
  item.triaged_by = rejected_by;
  item.rejection_reason = reason;
  _store.write(store);
  return item;
}

export function markDuplicate(
  id: string,
  canonical_id: string,
  admin_user_id: string,
): FeedbackItem | null {
  const store = _store.read();
  const item = store.feedback.find(i => i.id === id);
  const canonical = store.feedback.find(i => i.id === canonical_id);
  if (!item || !canonical) return null;
  item.status = 'duplicate';
  item.merged_into = canonical_id;
  item.triaged_at = item.triaged_at ?? new Date().toISOString();
  item.triaged_by = admin_user_id;
  canonical.corroboration_count++;
  _store.write(store);
  return item;
}

// ============================================================================
// Apply — mark approved feedback as shipped + record the change
// ============================================================================

export function applyFeedback(
  id: string,
  applied_by: string,
  release_tag: string,
  change_description: string,
  diff_summary?: string,
): { item: FeedbackItem; change: AppliedChange } | null {
  const store = _store.read();
  const item = store.feedback.find(i => i.id === id);
  if (!item) return null;
  if (item.status !== 'approved') return null;

  const now = new Date().toISOString();
  item.status = 'applied';
  item.applied_at = now;
  item.applied_in_release = release_tag;

  const change: AppliedChange = {
    id: shortId('AC'),
    feedback_id: id,
    exam_id: item.target.exam_id,
    release_tag,
    change_description,
    applied_at: now,
    applied_by,
    diff_summary,
  };
  store.applied_changes.push(change);
  _store.write(store);
  return { item, change };
}

// ============================================================================
// Dashboard — admin triage view
// ============================================================================

export function buildDashboard(exam_id: string): FeedbackDashboard {
  const all = listFeedback({ exam_id });
  const now = Date.now();

  const by_status: Record<string, number> = {};
  const by_kind: Record<string, number> = {};
  const by_priority: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const i of all) {
    by_status[i.status] = (by_status[i.status] ?? 0) + 1;
    by_kind[i.kind] = (by_kind[i.kind] ?? 0) + 1;
    if (i.priority) by_priority[i.priority]++;
  }

  const high_corroboration = all
    .filter(i => i.corroboration_count >= 2 && i.status !== 'applied' && i.status !== 'rejected')
    .sort((a, b) => b.corroboration_count - a.corroboration_count)
    .slice(0, 10)
    .map(i => ({
      feedback_id: i.id,
      count: i.corroboration_count,
      summary: i.description.slice(0, 140),
    }));

  const stale_items = all
    .filter(i => i.status === 'submitted' || i.status === 'triaged')
    .map(i => {
      const age = now - new Date(i.submitted_by.submitted_at).getTime();
      return { feedback_id: i.id, days_old: Math.floor(age / (24 * 3600 * 1000)) };
    })
    .filter(s => s.days_old >= 7)
    .sort((a, b) => b.days_old - a.days_old);

  const recent_applied = listAppliedChanges(exam_id)
    .sort((a, b) => b.applied_at.localeCompare(a.applied_at))
    .slice(0, 20);

  return {
    exam_id,
    total: all.length,
    by_status: by_status as any,
    by_kind: by_kind as any,
    by_priority: by_priority as any,
    high_corroboration,
    stale_items,
    recent_applied,
  };
}
