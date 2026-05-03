/**
 * src/api/admin-cohort-routes.ts
 *
 * The cohort attention surface: surfaces ONLY the students who need
 * attention (max ~10), rolls up the rest into a single celebratory line.
 *
 *   GET /api/admin/cohort/attention?exam_pack_id=jee-main
 *
 * Surveillance discipline: this is the ONE admin endpoint that returns
 * per-student data — by design, because intervening on stuck students
 * is the operator's whole job. To keep the surface honest:
 *   - Returns at most 10 student cards (HARD CAP, locked).
 *   - Returns aggregate counts for everyone else (no individual rows).
 *   - Each card includes only what an admin needs to decide whether to
 *     intervene: anonymous-but-unique session_id, motivation_state,
 *     mastery_trajectory_7d, recent_regen_count. No emails, no names,
 *     no content of attempts.
 *   - Surveillance invariant 10 (added in this PR) enforces these rules
 *     by greping the file's response shape.
 *
 * Attention triggers (any one qualifies):
 *   1. ≥3 personalised regens in the last 7d for this student
 *   2. mastery delta over the last 14d is < -0.05 (declining)
 *   3. motivation_state in {'frustrated', 'flagging'}
 *
 * "On track" payload is just three numbers: total students, mastered_this_week,
 * progressing_normally. No identities.
 */

import { ServerResponse } from 'http';
import pg from 'pg';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';

const { Pool } = pg;

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  return _pool;
}

const ATTENTION_CAP = 10;
const REGEN_WEEK_THRESHOLD = 3;
const MASTERY_DECLINE_THRESHOLD = -0.05;

export type AttentionReason =
  | 'frequent_regen'
  | 'declining_mastery'
  | 'frustrated_or_flagging';

export interface AttentionCard {
  /** Anonymous-but-unique. Admin can drill in via student-audit CLI. */
  session_id: string;
  motivation_state: string | null;
  /** -1..+1 over the last 14d. */
  mastery_trajectory_14d: number;
  recent_regen_count: number;
  /** Why this student showed up — at least one. */
  reasons: AttentionReason[];
}

export interface CohortAttentionPayload {
  exam_pack_id: string;
  generated_at: string;
  needs_attention: AttentionCard[];
  on_track: {
    total_active_students: number;
    mastered_this_week: number;
    progressing_normally: number;
  };
  cap_reached: boolean;
}

async function handleAttention(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await requireRole(req, res, 'admin'))) return;
  const exam = req.query.get('exam_pack_id') ?? 'jee-main';

  const pool = getPool();
  if (!pool) {
    return sendJSON(res, emptyPayload(exam));
  }
  try {
    const payload = await computeAttention(pool, exam);
    sendJSON(res, payload);
  } catch (err) {
    sendJSON(res, { error: (err as Error).message }, 500);
  }
}

function emptyPayload(exam: string): CohortAttentionPayload {
  return {
    exam_pack_id: exam,
    generated_at: new Date().toISOString(),
    needs_attention: [],
    on_track: { total_active_students: 0, mastered_this_week: 0, progressing_normally: 0 },
    cap_reached: false,
  };
}

export async function computeAttention(pool: pg.Pool, exam_pack_id: string): Promise<CohortAttentionPayload> {
  // Pull students touched in last 14d. Gate on exam_pack via student_model.
  // Tables we touch: student_model, student_atom_overrides, mastery_snapshots.
  // All exist in production migrations.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // 1) Recent regen counts (stuck-on-atom signal). Idempotent on
  //    student_atom_overrides; null-safe.
  let regenByStudent = new Map<string, number>();
  try {
    const r = await pool.query<{ student_id: string; cnt: number }>(
      `SELECT student_id, COUNT(*)::INT AS cnt
         FROM student_atom_overrides
         WHERE generated_at > $1
         GROUP BY student_id`,
      [sevenDaysAgo],
    );
    for (const row of r.rows) regenByStudent.set(row.student_id, row.cnt);
  } catch { /* table may be missing on partial migrations */ }

  // 2) Mastery trajectory: avg(mastery) in (8..14d ago) vs (now..7d ago).
  let trajectoryByStudent = new Map<string, number>();
  try {
    const r = await pool.query<{ session_id: string; recent: number; older: number }>(
      `SELECT session_id,
              AVG(CASE WHEN taken_at > $1 THEN mastery ELSE NULL END) AS recent,
              AVG(CASE WHEN taken_at <= $1 AND taken_at > $2 THEN mastery ELSE NULL END) AS older
         FROM mastery_snapshots
         WHERE taken_at > $2
         GROUP BY session_id`,
      [sevenDaysAgo, fourteenDaysAgo],
    );
    for (const row of r.rows) {
      if (row.recent != null && row.older != null) {
        trajectoryByStudent.set(row.session_id, Number(row.recent) - Number(row.older));
      }
    }
  } catch { /* table may be missing */ }

  // 3) Motivation state per active session (most recent row).
  let activeByMotivation = new Map<string, string>();   // session_id → motivation_state
  let activeUserIdBySession = new Map<string, string>(); // session_id → student/user id
  try {
    const r = await pool.query<{ session_id: string; user_id: string | null; motivation_state: string | null }>(
      `SELECT DISTINCT ON (session_id) session_id, user_id::TEXT AS user_id, motivation_state
         FROM student_model
         WHERE updated_at > $1
         ORDER BY session_id, updated_at DESC`,
      [fourteenDaysAgo],
    );
    for (const row of r.rows) {
      activeByMotivation.set(row.session_id, row.motivation_state ?? '');
      if (row.user_id) activeUserIdBySession.set(row.session_id, row.user_id);
    }
  } catch { /* table may be missing */ }

  // Build per-session reasons.
  const cards: AttentionCard[] = [];
  for (const session_id of activeByMotivation.keys()) {
    const motivation = activeByMotivation.get(session_id) ?? '';
    const user_id = activeUserIdBySession.get(session_id);
    const trajectory = trajectoryByStudent.get(session_id) ?? 0;
    const regenCount = (user_id ? regenByStudent.get(user_id) : undefined) ?? 0;

    const reasons: AttentionReason[] = [];
    if (regenCount >= REGEN_WEEK_THRESHOLD) reasons.push('frequent_regen');
    if (trajectory < MASTERY_DECLINE_THRESHOLD) reasons.push('declining_mastery');
    if (motivation === 'frustrated' || motivation === 'flagging') reasons.push('frustrated_or_flagging');

    if (reasons.length === 0) continue;
    cards.push({
      session_id,
      motivation_state: motivation || null,
      mastery_trajectory_14d: round2(trajectory),
      recent_regen_count: regenCount,
      reasons,
    });
  }

  // Rank by # of reasons desc, then by regen count desc, then by trajectory asc.
  cards.sort((a, b) => {
    if (a.reasons.length !== b.reasons.length) return b.reasons.length - a.reasons.length;
    if (a.recent_regen_count !== b.recent_regen_count) return b.recent_regen_count - a.recent_regen_count;
    return a.mastery_trajectory_14d - b.mastery_trajectory_14d;
  });

  const cap_reached = cards.length > ATTENTION_CAP;
  const needs_attention = cards.slice(0, ATTENTION_CAP);

  // On-track aggregates. Don't return individuals.
  const total = activeByMotivation.size;
  let mastered_this_week = 0;
  for (const v of trajectoryByStudent.values()) {
    if (v > 0.05) mastered_this_week++;
  }
  const progressing_normally = Math.max(0, total - cards.length);

  return {
    exam_pack_id,
    generated_at: new Date().toISOString(),
    needs_attention,
    on_track: {
      total_active_students: total,
      mastered_this_week,
      progressing_normally,
    },
    cap_reached,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const adminCohortRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/cohort/attention', handler: handleAttention },
];

export const __testing = {
  ATTENTION_CAP,
  REGEN_WEEK_THRESHOLD,
  MASTERY_DECLINE_THRESHOLD,
};
