/**
 * src/scoring/quiz-store-pg.ts — T14 (B5): Postgres access for
 * `quiz_sessions` (migration 046). Pure DB plumbing — pool assembly
 * (src/readiness/quiz-pool.ts) and grading (deterministic-scorer.ts) live
 * elsewhere and stay DB-free.
 *
 * Idempotent submission is the point of this module: `trySubmit` performs
 * the state transition with an optimistic `WHERE status = 'in_progress'`
 * guard (same pattern as `PgTeacherQueueRepo.resolve()`) so only the FIRST
 * call that reaches Postgres actually grades; every later call for the
 * same quiz id — a retry, a double-tap, a network resend — reads back the
 * ALREADY-PERSISTED result instead of re-grading a possibly different
 * payload. That is what makes "double-submit idempotent" true at the
 * session level, on top of the per-item idempotency `StudentModel.update()`
 * already provides via `attempt_dedup`.
 */

import type pg from 'pg';
import { getSharedPool } from '../storage/pool';

// T16 (D4 / OV2 #10): was its own dedicated `new Pool({max:5})` — now the
// one shared pool (src/storage/pool.ts). Every exported function below
// documents "throws on DB-less" as its contract (callers decide the
// honest fallback), so a missing DATABASE_URL still throws here — just
// with an explicit message instead of a query later failing to connect.
function getPool(): pg.Pool {
  const pool = getSharedPool();
  if (!pool) throw new Error('[quiz-store-pg] DATABASE_URL not configured');
  return pool;
}

export interface QuizSessionRow {
  id: string;
  studentId: string;
  itemIds: string[];
  status: 'in_progress' | 'submitted';
  startedAtMs: number;
  deadlineAtMs: number;
  submittedAtMs: number | null;
  gradedAtMs: number | null;
  late: boolean;
  score: number | null;
  maxMarks: number | null;
  result: unknown | null;
}

function toRow(r: any): QuizSessionRow {
  return {
    id: String(r.id),
    studentId: String(r.student_id),
    itemIds: Array.isArray(r.item_ids) ? r.item_ids.map(String) : [],
    status: r.status === 'submitted' ? 'submitted' : 'in_progress',
    startedAtMs: new Date(r.started_at).getTime(),
    deadlineAtMs: new Date(r.deadline_at).getTime(),
    submittedAtMs: r.submitted_at ? new Date(r.submitted_at).getTime() : null,
    gradedAtMs: r.graded_at ? new Date(r.graded_at).getTime() : null,
    late: Boolean(r.late),
    score: r.score === null || r.score === undefined ? null : Number(r.score),
    maxMarks: r.max_marks === null || r.max_marks === undefined ? null : Number(r.max_marks),
    result: r.result ?? null,
  };
}

/** Creates a new in-progress quiz session. Throws on DB-less / failure — callers decide the honest fallback. */
export async function createQuizSession(params: {
  id: string;
  studentId: string;
  itemIds: string[];
  startedAtMs: number;
  deadlineAtMs: number;
}): Promise<QuizSessionRow> {
  const { rows } = await getPool().query(
    `INSERT INTO quiz_sessions (id, student_id, item_ids, status, started_at, deadline_at)
     VALUES ($1, $2, $3, 'in_progress', $4, $5)
     RETURNING *`,
    [params.id, params.studentId, params.itemIds, new Date(params.startedAtMs).toISOString(), new Date(params.deadlineAtMs).toISOString()],
  );
  return toRow(rows[0]);
}

export async function getQuizSession(id: string): Promise<QuizSessionRow | null> {
  const { rows } = await getPool().query(`SELECT * FROM quiz_sessions WHERE id = $1`, [id]);
  return rows.length > 0 ? toRow(rows[0]) : null;
}

/**
 * The most recent completed quiz's `submitted_at`, or null if the student
 * has never submitted one — the baseline the "quiz every N XP" cadence
 * resets against (T14 follow-up: the meter must re-arm after each quiz,
 * not gate on a one-time lifetime total). Deliberately scoped to
 * `status = 'submitted'` — an in-progress (never-submitted) quiz must
 * never move the baseline, or abandoning a quiz mid-way would silently
 * reset the student's meter for nothing.
 */
export async function getLastSubmittedQuizAt(studentId: string): Promise<number | null> {
  const { rows } = await getPool().query(
    `SELECT MAX(submitted_at) AS last_submitted_at FROM quiz_sessions WHERE student_id = $1 AND status = 'submitted'`,
    [studentId],
  );
  const raw = rows[0]?.last_submitted_at;
  return raw ? new Date(raw).getTime() : null;
}

/**
 * Attempts the in_progress → submitted transition. Returns `{ fresh: true, row }`
 * when THIS call performed it (caller should grade + persist via
 * `finalizeQuizSubmission`); `{ fresh: false, row }` when the session was
 * already submitted (caller must NOT re-grade — just replay `row.result`);
 * `null` when the id doesn't exist.
 */
export async function claimSubmission(id: string, nowMs: number): Promise<{ fresh: boolean; row: QuizSessionRow } | null> {
  const claimed = await getPool().query(
    `UPDATE quiz_sessions SET status = 'submitted', submitted_at = $2
       WHERE id = $1 AND status = 'in_progress'
       RETURNING *`,
    [id, new Date(nowMs).toISOString()],
  );
  if (claimed.rows.length > 0) {
    return { fresh: true, row: toRow(claimed.rows[0]) };
  }
  const existing = await getQuizSession(id);
  if (!existing) return null;
  return { fresh: false, row: existing };
}

/** Persists the graded outcome after a fresh claim. */
export async function finalizeQuizSubmission(
  id: string,
  outcome: { late: boolean; score: number; maxMarks: number; result: unknown; gradedAtMs: number },
): Promise<QuizSessionRow> {
  const { rows } = await getPool().query(
    `UPDATE quiz_sessions
        SET late = $2, score = $3, max_marks = $4, result = $5::jsonb, graded_at = $6
      WHERE id = $1
      RETURNING *`,
    [id, outcome.late, outcome.score, outcome.maxMarks, JSON.stringify(outcome.result), new Date(outcome.gradedAtMs).toISOString()],
  );
  return toRow(rows[0]);
}
