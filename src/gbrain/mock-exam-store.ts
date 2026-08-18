/**
 * src/gbrain/mock-exam-store.ts — T22 (ENG-D3): Postgres access for
 * `mock_exams` (migration 047), replacing the ad-hoc runtime
 * `CREATE TABLE IF NOT EXISTS` that used to live inline inside
 * `generateMockExam()` and bypassed the schema-column gate entirely.
 *
 * Same idempotent-submission shape as `src/scoring/quiz-store-pg.ts`:
 * `claimSubmission` performs an optimistic `WHERE status = 'in_progress'`
 * transition so only the FIRST submit call grades; every later call for
 * the same exam id replays the persisted `analysis`.
 */

import type pg from 'pg';
import { getSharedPool } from '../storage/pool';

// T16-follow-up (D4 / OV2 #10): was its own dedicated `new Pool({max:5})`
// — now the one shared pool (src/storage/pool.ts). No session-scoped needs
// here (no advisory locks, no LISTEN/NOTIFY), so this has no reason to be
// on the exception list in that file's header comment.
function getPool(): pg.Pool {
  const pool = getSharedPool();
  if (!pool) throw new Error('[mock-exam-store] DATABASE_URL not configured');
  return pool;
}

export interface MockExamRow {
  id: string;
  sessionId: string;
  examKey: string;
  /** Full question set INCLUDING answer keys — server-only, never serialized to a client. */
  questions: unknown[];
  timeLimitMinutes: number;
  status: 'in_progress' | 'submitted';
  late: boolean;
  score: number | null;
  maxMarks: number | null;
  createdAtMs: number;
  submittedAtMs: number | null;
  gradedAtMs: number | null;
  analysis: unknown | null;
}

function toRow(r: any): MockExamRow {
  return {
    id: String(r.id),
    sessionId: String(r.session_id),
    examKey: String(r.exam_key),
    questions: Array.isArray(r.questions) ? r.questions : [],
    timeLimitMinutes: Number(r.time_limit_minutes),
    status: r.status === 'submitted' ? 'submitted' : 'in_progress',
    late: Boolean(r.late),
    score: r.score === null || r.score === undefined ? null : Number(r.score),
    maxMarks: r.max_marks === null || r.max_marks === undefined ? null : Number(r.max_marks),
    createdAtMs: new Date(r.created_at).getTime(),
    submittedAtMs: r.submitted_at ? new Date(r.submitted_at).getTime() : null,
    gradedAtMs: r.graded_at ? new Date(r.graded_at).getTime() : null,
    analysis: r.analysis ?? null,
  };
}

export async function createMockExam(params: {
  id: string; sessionId: string; examKey: string; questions: unknown[]; timeLimitMinutes: number;
}): Promise<MockExamRow> {
  const { rows } = await getPool().query(
    `INSERT INTO mock_exams (id, session_id, exam_key, questions, time_limit_minutes, status)
     VALUES ($1, $2, $3, $4::jsonb, $5, 'in_progress')
     RETURNING *`,
    [params.id, params.sessionId, params.examKey, JSON.stringify(params.questions), params.timeLimitMinutes],
  );
  return toRow(rows[0]);
}

export async function getMockExam(id: string): Promise<MockExamRow | null> {
  const { rows } = await getPool().query(`SELECT * FROM mock_exams WHERE id = $1`, [id]);
  return rows.length > 0 ? toRow(rows[0]) : null;
}

export async function claimMockExamSubmission(id: string, nowMs: number): Promise<{ fresh: boolean; row: MockExamRow } | null> {
  const claimed = await getPool().query(
    `UPDATE mock_exams SET status = 'submitted', submitted_at = $2
       WHERE id = $1 AND status = 'in_progress'
       RETURNING *`,
    [id, new Date(nowMs).toISOString()],
  );
  if (claimed.rows.length > 0) return { fresh: true, row: toRow(claimed.rows[0]) };
  const existing = await getMockExam(id);
  if (!existing) return null;
  return { fresh: false, row: existing };
}

export async function finalizeMockExamSubmission(
  id: string,
  outcome: { late: boolean; score: number; maxMarks: number; analysis: unknown; gradedAtMs: number },
): Promise<MockExamRow> {
  const { rows } = await getPool().query(
    `UPDATE mock_exams
        SET late = $2, score = $3, max_marks = $4, analysis = $5::jsonb, graded_at = $6
      WHERE id = $1
      RETURNING *`,
    [id, outcome.late, outcome.score, outcome.maxMarks, JSON.stringify(outcome.analysis), new Date(outcome.gradedAtMs).toISOString()],
  );
  return toRow(rows[0]);
}
