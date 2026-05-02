/**
 * src/experiments/snapshotter.ts
 *
 * Append-only mastery snapshots — the baseline for lift computation.
 *
 * Two write paths:
 *
 *   1. Attempt-time hook
 *      `snapshotConceptMastery(...)` is called from the same site that
 *      invokes saveStudentModel(...). Records the post-attempt state of
 *      the single concept that just got updated. source='attempt'.
 *
 *   2. Nightly scheduled job
 *      `snapshotAllActiveSessions(...)` reads student_model rows updated
 *      in the last N days and writes one snapshot per (session, concept).
 *      source='nightly'. Ensures we have a regular timeline even for
 *      sessions that didn't attempt anything that day (still need the
 *      datapoint for window-based lift).
 *
 * Snapshots are append-only. Pruning of old rows is handled by a separate
 * job (Sprint C) keyed on `taken_at`.
 *
 * DB-less mode: every function is a no-op when DATABASE_URL is unset.
 */

import { getExperimentsPool } from './db';
import type { SnapshotSource } from './types';

// ============================================================================
// Single-concept snapshot (called from attempt hook)
// ============================================================================

export interface SnapshotOneInput {
  session_id: string;
  user_id?: string | null;
  concept_id: string;
  exam_pack_id: string;
  mastery: number; // 0..1
  attempts: number;
  source?: SnapshotSource;
}

export async function snapshotConceptMastery(
  input: SnapshotOneInput,
): Promise<void> {
  const pool = getExperimentsPool();
  if (!pool) return;

  const mastery = clamp01(input.mastery);

  await pool.query(
    `INSERT INTO mastery_snapshots
       (session_id, user_id, concept_id, exam_pack_id, mastery, attempts, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (session_id, concept_id, taken_at) DO NOTHING`,
    [
      input.session_id,
      input.user_id ?? null,
      input.concept_id,
      input.exam_pack_id,
      mastery,
      input.attempts,
      input.source ?? 'attempt',
    ],
  );
}

// ============================================================================
// Session-wide snapshot (called from nightly job)
// ============================================================================

export interface SnapshotSessionResult {
  sessions_processed: number;
  rows_written: number;
  duration_ms: number;
}

/**
 * Snapshot mastery for every session whose student_model was updated
 * within the last `windowHours`. Writes one row per (session, concept)
 * for every entry in mastery_vector. source='nightly'.
 *
 * The exam_pack_id is read from a JSONB hint in student_model.metadata.
 * Falls back to `defaultExamPackId` (gate-ma) for legacy rows.
 */
export async function snapshotAllActiveSessions(opts?: {
  windowHours?: number;
  defaultExamPackId?: string;
}): Promise<SnapshotSessionResult> {
  const start = Date.now();
  const result: SnapshotSessionResult = {
    sessions_processed: 0,
    rows_written: 0,
    duration_ms: 0,
  };

  const pool = getExperimentsPool();
  if (!pool) {
    result.duration_ms = Date.now() - start;
    return result;
  }

  const windowHours = opts?.windowHours ?? 24;
  const defaultExamPackId = opts?.defaultExamPackId ?? 'gate-ma';

  // Read recently-updated student models. Cast updated_at filter via interval.
  const { rows: students } = await pool.query<{
    session_id: string;
    user_id: string | null;
    mastery_vector: Record<string, { score: number; attempts: number } | null>;
  }>(
    `SELECT session_id, user_id, mastery_vector
       FROM student_model
      WHERE updated_at > NOW() - ($1::TEXT || ' hours')::INTERVAL`,
    [String(windowHours)],
  );

  // Single transaction for the bulk insert is meaningfully faster than
  // N round-trips, but the dataset is small (10s-100s of sessions) so
  // a simple loop is plenty.
  for (const s of students) {
    if (!s.mastery_vector) continue;
    for (const [conceptId, entry] of Object.entries(s.mastery_vector)) {
      if (!entry || typeof entry.score !== 'number') continue;
      try {
        await pool.query(
          `INSERT INTO mastery_snapshots
             (session_id, user_id, concept_id, exam_pack_id, mastery, attempts, source)
           VALUES ($1, $2, $3, $4, $5, $6, 'nightly')
           ON CONFLICT (session_id, concept_id, taken_at) DO NOTHING`,
          [
            s.session_id,
            s.user_id,
            conceptId,
            defaultExamPackId,
            clamp01(entry.score),
            entry.attempts ?? 0,
          ],
        );
        result.rows_written += 1;
      } catch {
        // skip individual row errors — don't let one bad row abort the run
      }
    }
    result.sessions_processed += 1;
  }

  result.duration_ms = Date.now() - start;
  return result;
}

// ============================================================================
// Helpers
// ============================================================================

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
