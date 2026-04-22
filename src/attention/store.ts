// @ts-nocheck
/**
 * Attention Store — persistence for cumulative coverage.
 *
 * The resolver is pure. The store holds the side-effect state that
 * makes the compound-competence guarantee work:
 *
 *   - trailing-7-day minutes + session count per student
 *   - deferred (topic, difficulty) pairs that nano/short sessions
 *     couldn't serve — must eventually be promoted
 *
 * Uses the same flat-file primitive as every other persistence module
 * in the project. No new dependencies.
 */

import { createFlatFileStore } from '../lib/flat-file-store';
import type { CumulativeCoverage } from './types';

// ============================================================================

interface StoreShape {
  coverage: CumulativeCoverage[];
}

const STORE_PATH = '.data/attention-coverage.json';

const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ coverage: [] }),
});

// ============================================================================

export function getCoverage(user_id: string): CumulativeCoverage | null {
  return _store.read().coverage.find(c => c.user_id === user_id) ?? null;
}

/**
 * Record a session — updates trailing-7-day counts.
 * Called after every student interaction that consumed attention.
 */
export function recordSession(user_id: string, minutes: number): CumulativeCoverage {
  const store = _store.read();
  let record = store.coverage.find(c => c.user_id === user_id);
  if (!record) {
    record = {
      user_id,
      deferred: [],
      trailing_7d_minutes: 0,
      trailing_7d_sessions: 0,
      updated_at: new Date().toISOString(),
    };
    store.coverage.push(record);
  }

  // Trailing 7d maintenance is approximated: we add the new session and
  // rely on a scheduled cleanup to prune. For the smoke test window
  // this is fine. Production would add per-session timestamps and prune.
  record.trailing_7d_minutes += minutes;
  record.trailing_7d_sessions += 1;
  record.updated_at = new Date().toISOString();

  _store.write(store);
  return record;
}

/**
 * Mark a (topic, difficulty) as deferred — the student had a budget too
 * short to serve this topic, but they've asked for this topic area or
 * it was in the priority queue. Promoted back when a longer session
 * becomes available OR when times_deferred crosses a threshold.
 */
export function markDeferred(
  user_id: string,
  topic_id: string,
  difficulty: 'easy' | 'medium' | 'hard',
): CumulativeCoverage {
  const store = _store.read();
  let record = store.coverage.find(c => c.user_id === user_id);
  if (!record) {
    record = {
      user_id,
      deferred: [],
      trailing_7d_minutes: 0,
      trailing_7d_sessions: 0,
      updated_at: new Date().toISOString(),
    };
    store.coverage.push(record);
  }

  const now = new Date().toISOString();
  const existing = record.deferred.find(d => d.topic_id === topic_id && d.difficulty === difficulty);
  if (existing) {
    existing.times_deferred += 1;
    existing.last_deferred_at = now;
  } else {
    record.deferred.push({
      topic_id,
      difficulty,
      times_deferred: 1,
      first_deferred_at: now,
      last_deferred_at: now,
    });
  }
  record.updated_at = now;
  _store.write(store);
  return record;
}

/**
 * Clear a deferral once the topic has been served in a session long
 * enough to handle it.
 */
export function clearDeferred(
  user_id: string,
  topic_id: string,
  difficulty: 'easy' | 'medium' | 'hard',
): void {
  const store = _store.read();
  const record = store.coverage.find(c => c.user_id === user_id);
  if (!record) return;
  record.deferred = record.deferred.filter(
    d => !(d.topic_id === topic_id && d.difficulty === difficulty),
  );
  record.updated_at = new Date().toISOString();
  _store.write(store);
}

/**
 * Get the topics that have been deferred N+ times — these should be
 * PROMOTED: surfaced regardless of current budget because avoiding them
 * further would harm competence. The caller decides the threshold;
 * default 3.
 */
export function getOverdueDeferrals(
  user_id: string,
  threshold = 3,
): Array<{ topic_id: string; difficulty: 'easy' | 'medium' | 'hard'; times_deferred: number }> {
  const record = getCoverage(user_id);
  if (!record) return [];
  return record.deferred
    .filter(d => d.times_deferred >= threshold)
    .map(d => ({ topic_id: d.topic_id, difficulty: d.difficulty, times_deferred: d.times_deferred }));
}
