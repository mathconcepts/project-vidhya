// @ts-nocheck
/**
 * Practice-session log — timestamped per-session minute records.
 *
 * Plan executions (session-planner/store.ts) already capture this for
 * plan-driven sessions. But students ALSO practice outside of plans —
 * free-form SmartPracticePage sessions, problem-by-problem via
 * /gate/practice/:problemId, etc. Those sessions should also count
 * toward trailing_7d_minutes so the attention resolver sees the full
 * picture.
 *
 * Design: a tiny append-only log keyed by student_id with a
 * completed_at timestamp and minutes. sumTrailingMinutes() unions
 * this with plan-execution totals.
 *
 * Why a separate store:
 *   - Plan executions are rich records with action outcomes; this is
 *     one row per interaction. Different shapes.
 *   - Separating concerns: plan code shouldn't know about ad-hoc
 *     practice, and practice code shouldn't write into the plan
 *     store.
 *   - Different pruning policies — ad-hoc sessions can be kept
 *     longer since the row is tiny.
 *
 * Lazy pruning: entries older than 30 days are dropped on writes.
 * Trailing-7d aggregation never needs older data.
 */

import { createFlatFileStore } from '../lib/flat-file-store';

export interface PracticeSessionEntry {
  student_id: string;
  /** Minutes spent in this interaction — 0.5 OK (rounded to 0.1 precision) */
  minutes: number;
  /** ISO timestamp of when the session ended */
  completed_at: string;
  /** Source of the session — useful for analytics, not for math */
  source: 'smart-practice' | 'practice-page' | 'mock-exam' | 'plan-execution' | 'other';
  /** Optional plan_id if the session came from a planned action */
  plan_id?: string;
}

interface StoreShape {
  entries: PracticeSessionEntry[];
}

const STORE_PATH = '.data/practice-sessions.json';
const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ entries: [] }),
});

const PRUNE_AFTER_DAYS = 30;

export function logPracticeSession(entry: PracticeSessionEntry): void {
  const store = _store.read();
  store.entries.push(entry);

  // Prune aggressively — anything older than PRUNE_AFTER_DAYS is gone.
  const cutoff = Date.now() - PRUNE_AFTER_DAYS * 24 * 60 * 60 * 1000;
  const kept = store.entries.filter(e => {
    const t = new Date(e.completed_at).getTime();
    return !isNaN(t) && t >= cutoff;
  });
  _store.write({ entries: kept });
}

export function sumTrailingPracticeMinutes(
  student_id: string,
  days = 7,
  now = new Date(),
): number {
  const store = _store.read();
  const cutoffMs = now.getTime() - days * 24 * 60 * 60 * 1000;
  let total = 0;
  for (const e of store.entries) {
    if (e.student_id !== student_id) continue;
    const t = new Date(e.completed_at).getTime();
    if (isNaN(t) || t < cutoffMs) continue;
    total += e.minutes || 0;
  }
  return total;
}

export function countTrailingSessions(
  student_id: string,
  days = 7,
  now = new Date(),
): number {
  const store = _store.read();
  const cutoffMs = now.getTime() - days * 24 * 60 * 60 * 1000;
  let count = 0;
  for (const e of store.entries) {
    if (e.student_id !== student_id) continue;
    const t = new Date(e.completed_at).getTime();
    if (isNaN(t) || t < cutoffMs) continue;
    count += 1;
  }
  return count;
}

/** Test-only reset. */
export function _resetPracticeSessionLog(): void {
  _store.write({ entries: [] });
}

/**
 * Enumerate all entries. Used by session-planner/store.ts
 * sumTrailingMinutes to integrate ad-hoc sessions without
 * double-counting plan-driven ones.
 */
export function _enumerateEntriesForTest(): PracticeSessionEntry[] {
  return _store.read().entries.slice();
}
