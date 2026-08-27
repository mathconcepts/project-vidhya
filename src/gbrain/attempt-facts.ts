/**
 * src/gbrain/attempt-facts.ts — writers for `attempt_facts` (migration 051).
 *
 * Plan E1. Before this module the repo had no durable attempts table:
 * `attempt_dedup` is an idempotency key that is explicitly prunable,
 * `xp_events` writes no row at all for a skipped attempt and stores
 * neither correctness nor question kind, and `mock_exams.analysis` is one
 * aggregate blob per exam. W1.1 (stamp the contract version), W1.6 (the
 * anti-gaming guards) and W3.2 all need a row per graded attempt, so this
 * is that row.
 *
 * ── Two writers, one shape ───────────────────────────────────────────────
 *
 *   `attemptFactInsert()`   — the SQL + params, shared.
 *   `writeAttemptFactIn()`  — inside a caller's open transaction, wrapped
 *                             in a SAVEPOINT (see below). Used by
 *                             `PgStudentModel.update()`.
 *   `recordAttemptFacts()`  — on the shared pool, fire-and-forget. Used by
 *                             grading paths that never call
 *                             `StudentModel.update()` for a question (mock
 *                             exam questions; skipped quiz items).
 *
 * ── Why a SAVEPOINT rather than a bare INSERT in the transaction ─────────
 *
 * The plan asks for the fact to be written inside the same transaction as
 * the Elo/FSRS/dedup work, so a rolled-back attempt leaves no fact behind.
 * It ALSO asks for the shadow-log failure posture: a failure here logs and
 * never breaks grading. Those two are in direct tension — in Postgres, a
 * failed statement (a missing table on a deploy that has not applied 051
 * yet, a CHECK violation) aborts the whole transaction, so the next
 * COMMIT silently becomes a ROLLBACK. That is exactly the bug
 * `student-model-pg.ts`'s error-tag comment already documents having been
 * bitten by once: telemetry took the primary write down with it.
 *
 * A SAVEPOINT gets both properties. On success the fact commits atomically
 * with the attempt. On failure the transaction rolls back only to the
 * savepoint, the error is logged by name, and Elo + FSRS still commit.
 * Telemetry can be missing; a graded attempt cannot be lost.
 *
 * ── Latency is bucketed here, once ──────────────────────────────────────
 *
 * `latencyBucket()` is the only place milliseconds become a label, and the
 * label set matches the CHECK constraint in migration 051 exactly. A
 * non-positive or absent latency returns `null` — "not observed" — never
 * `'lt10s'`, which would read as "answered instantly" and be a
 * fabrication. See the migration header for why buckets and not
 * milliseconds.
 */

import type pg from 'pg';
import { getSharedPool } from '../storage/pool';

// ============================================================================
// Latency buckets
// ============================================================================

/**
 * The four labels, in increasing-time order. Exported so the W1.6 speed
 * guard can rank them without restating the list — a second copy of this
 * order would let the guard's arithmetic drift from what the writer stores.
 * MUST match the CHECK constraint in supabase/migrations/051_attempt_facts.sql.
 */
export const LATENCY_BUCKETS = ['lt10s', '10-30s', '30-90s', 'gt90s'] as const;

export type LatencyBucket = (typeof LATENCY_BUCKETS)[number];

/**
 * Bucket an answer latency, or `null` when there is none to bucket.
 *
 * `null`/`undefined`/`0`/negative all mean the same thing here: this
 * grading path did not observe how long the student took. Quiz items
 * graded from a single session-level submit are the common case — the
 * server sees one submit, not six per-item timings.
 */
export function latencyBucket(ms: number | null | undefined): LatencyBucket | null {
  if (ms === null || ms === undefined) return null;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  if (ms < 10_000) return 'lt10s';
  if (ms < 30_000) return '10-30s';
  if (ms < 90_000) return '30-90s';
  return 'gt90s';
}

// ============================================================================
// The row
// ============================================================================

export interface AttemptFact {
  studentId: string;
  objectId: string;
  /** Epoch ms. With (studentId, objectId) this is the idempotency key. */
  tsMs: number;
  /** 'mcq' | 'msq' | 'nat', or null when the grading path has no such kind. */
  questionKind?: string | null;
  marksEarned?: number | null;
  marksMax?: number | null;
  skipped: boolean;
  /** Resolved (or session-pinned) assessment contract version. */
  contractVersion?: string | null;
  /** Already bucketed. Pass `latencyBucket(ms)`, never raw milliseconds. */
  latencyBucket?: LatencyBucket | null;
  skillId?: string | null;
}

const INSERT_SQL = `
  INSERT INTO attempt_facts (
    student_id, object_id, ts_ms, question_kind,
    marks_earned, marks_max, skipped, contract_version, latency_bucket, skill_id
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  ON CONFLICT DO NOTHING`;

function paramsFor(f: AttemptFact): unknown[] {
  return [
    f.studentId,
    f.objectId,
    f.tsMs,
    f.questionKind ?? null,
    f.marksEarned ?? null,
    f.marksMax ?? null,
    f.skipped,
    f.contractVersion ?? null,
    f.latencyBucket ?? null,
    f.skillId ?? null,
  ];
}

/** The statement + params, exposed so tests can assert the shape once. */
export function attemptFactInsert(f: AttemptFact): { sql: string; params: unknown[] } {
  return { sql: INSERT_SQL, params: paramsFor(f) };
}

// ============================================================================
// Writers
// ============================================================================

/**
 * Write one fact inside the caller's ALREADY-OPEN transaction, isolated by
 * a SAVEPOINT. Returns true when the row was written (or was already
 * there), false when the write failed and was rolled back to the
 * savepoint. NEVER throws: the caller's transaction is guaranteed usable
 * on return either way, which is the whole point.
 */
export async function writeAttemptFactIn(
  client: pg.PoolClient,
  fact: AttemptFact,
): Promise<boolean> {
  const { sql, params } = attemptFactInsert(fact);
  try {
    await client.query('SAVEPOINT attempt_fact');
  } catch (err) {
    // Could not even open the savepoint — the transaction is already in
    // trouble. Say so and get out without touching it further.
    console.error(
      `[attempt-facts] could not open savepoint for student=${fact.studentId} object=${fact.objectId}:`,
      (err as Error)?.message ?? err,
    );
    return false;
  }
  try {
    await client.query(sql, params);
    await client.query('RELEASE SAVEPOINT attempt_fact');
    return true;
  } catch (err) {
    console.error(
      `[attempt-facts] insert failed for student=${fact.studentId} object=${fact.objectId} ts=${fact.tsMs} (attempt still recorded):`,
      (err as Error)?.message ?? err,
    );
    try {
      await client.query('ROLLBACK TO SAVEPOINT attempt_fact');
      await client.query('RELEASE SAVEPOINT attempt_fact');
    } catch (rollbackErr) {
      console.error(
        '[attempt-facts] savepoint rollback itself failed — the caller transaction may be aborted:',
        (rollbackErr as Error)?.message ?? rollbackErr,
      );
    }
    return false;
  }
}

/**
 * Write facts on the shared pool, outside any transaction. For grading
 * paths that never reach `StudentModel.update()` — every mock-exam
 * question, and skipped quiz items.
 *
 * Returns the number of statements that succeeded. DB-less returns 0
 * without an error: no database means no facts row, which is the honest
 * outcome, not a failure to report to a student mid-grade. Never throws.
 */
export async function recordAttemptFacts(facts: ReadonlyArray<AttemptFact>): Promise<number> {
  if (facts.length === 0) return 0;
  const pool = getSharedPool();
  if (!pool) return 0;

  let written = 0;
  for (const fact of facts) {
    const { sql, params } = attemptFactInsert(fact);
    try {
      await pool.query(sql, params);
      written++;
    } catch (err) {
      console.error(
        `[attempt-facts] insert failed for student=${fact.studentId} object=${fact.objectId} ts=${fact.tsMs} (grade still stands):`,
        (err as Error)?.message ?? err,
      );
    }
  }
  return written;
}
