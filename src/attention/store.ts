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
import * as _fs from 'fs';
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

/**
 * Read the cumulative coverage for a user. As of v2.33, the
 * `trailing_7d_minutes` and `trailing_7d_sessions` fields are derived
 * from the timestamped practice-session-log rather than the running
 * counter stored inline — that counter had no prune discipline and
 * was stale by design.
 *
 * The function remains synchronous: we read the practice log
 * synchronously via the flat-file store's public surface. The old
 * inline counter is still persisted but is no longer the source of
 * truth for reads; it's kept so old records survive migration.
 */
export function getCoverage(user_id: string): CumulativeCoverage | null {
  const record = _store.read().coverage.find(c => c.user_id === user_id);
  if (!record) return null;

  // Override the stale running counter with a fresh derivation from
  // the timestamped log. Deferred / updated_at / user_id pass through
  // unchanged.
  try {
    // Lazy ESM import done synchronously via require is unsafe; since
    // this function is sync, we read the log file directly. The log
    // module's default path is .data/practice-sessions.json — we use
    // its public enumerate helper when we can reach it, else fall
    // back to the old counter (correct behaviour pre-v2.32).
    const log = _readPracticeLogDirect();
    if (log !== null) {
      const now = Date.now();
      const cutoff = now - 7 * 24 * 60 * 60 * 1000;
      let minutes = 0, sessions = 0;
      for (const e of log) {
        if (e.student_id !== user_id) continue;
        const t = new Date(e.completed_at).getTime();
        if (isNaN(t) || t < cutoff) continue;
        minutes += e.minutes || 0;
        sessions += 1;
      }
      return { ...record, trailing_7d_minutes: minutes, trailing_7d_sessions: sessions };
    }
  } catch {
    // Fall through to inline counter
  }
  return record;
}

/**
 * Direct synchronous read of the practice log JSON. Returns null if
 * the file doesn't exist or isn't parseable. Exists as a helper
 * because our flat-file-store API is async-friendly and we don't
 * want to propagate `await` through every attention reader.
 *
 * Uses top-level `fs` (imported at module scope) rather than a lazy
 * require — simpler + works cleanly under both CJS and ESM tsx.
 */
function _readPracticeLogDirect(): Array<{
  student_id: string; minutes: number; completed_at: string;
  source?: string; plan_id?: string;
}> | null {
  try {
    const path = '.data/practice-sessions.json';
    if (!_fs.existsSync(path)) return [];
    const raw = _fs.readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.entries) ? parsed.entries : [];
  } catch {
    return null;
  }
}

/**
 * Record a session — writes into BOTH the legacy cumulative-coverage
 * store AND the timestamped practice log (as of v2.33). Reads now
 * derive from the log, but we keep writing to both so:
 *   - deferred/updated_at fields stay consistent with the inline
 *     record
 *   - any legacy consumer reading the raw JSON file still sees a
 *     counter value (rough but present)
 *
 * Became async in v2.33 because the practice-log module is imported
 * via `await import()` — `require()` doesn't work reliably in our
 * ESM-under-tsx context.
 */
export async function recordSession(user_id: string, minutes: number): Promise<CumulativeCoverage> {
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

  // Legacy counter — no prune; reads now ignore this, but we keep it
  // writing for legacy compat.
  record.trailing_7d_minutes += minutes;
  record.trailing_7d_sessions += 1;
  record.updated_at = new Date().toISOString();
  _store.write(store);

  // Primary path: write to the timestamped practice log. Failure is
  // non-fatal — the inline counter is a degraded fallback.
  try {
    const mod = await import('../session-planner/practice-session-log');
    mod.logPracticeSession({
      student_id: user_id,
      minutes,
      completed_at: new Date().toISOString(),
      source: 'other',
    });
  } catch {
    // Log unavailable — callers get the stale counter via the read
    // path's fallback.
  }

  // Return the updated view — re-read so callers see the freshly-
  // derived 7d totals, not the stale inline counter.
  return getCoverage(user_id) ?? record;
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
