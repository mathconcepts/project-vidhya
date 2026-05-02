/**
 * src/api/admin-holdout-routes.ts
 *
 * Admin REST surface for the Phase 1 holdout PYQ bank (migration 024).
 *
 *   GET /api/admin/holdout/summary?exam=gate-ma
 *     - Per-exam holdout count + stratification by (year, topic)
 *     - Cohort accuracy on holdout from sr_attempts (treatment cohort
 *       defaults to "all sessions in the exam"; admin can refine in UI)
 *     - Time series of accuracy delta vs the corpus baseline (last 28 days)
 *
 *   GET /api/admin/holdout/pyqs?exam=gate-ma
 *     - Listing of every holdout PYQ for the exam, with attempt counts
 *       and current accuracy on the holdout cohort. Used by the holdout
 *       dashboard to surface "which PYQs are easiest / hardest".
 *
 * Auth: requireRole('admin') — same gate as all /api/admin/* routes.
 *
 * Read-only for now. The holdout bank itself is seeded via the CLI script
 * (scripts/seed-pyq-holdout.ts) and never mutated through this REST surface.
 * The locked invariant from PR #31 still holds.
 */

import { ServerResponse } from 'http';
import pg from 'pg';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';

const { Pool } = pg;
let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function checkAdminAuth(req: ParsedRequest, res: ServerResponse): Promise<boolean> {
  const user = await requireRole(req, res, 'admin');
  return user !== null;
}

function requireDb(res: ServerResponse): boolean {
  if (!process.env.DATABASE_URL) {
    sendJSON(res, { error: 'DATABASE_URL not configured' }, 503);
    return false;
  }
  return true;
}

function badRequest(res: ServerResponse, message: string): void {
  sendJSON(res, { error: 'Bad Request', message }, 400);
}

// ============================================================================
// Handlers
// ============================================================================

/**
 * Summary view: total + stratified counts + 28-day accuracy timeline.
 * Tolerates the absence of sr_attempts (falls back to zero attempts so
 * the page renders even on a fresh DB).
 */
async function handleSummary(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const exam = req.query.get('exam');
  if (!exam) return badRequest(res, 'exam query param required');

  const pool = getPool();
  if (!pool) return;

  // Stratification: count of holdout PYQs grouped by (year, topic)
  const { rows: stratification } = await pool.query<{
    year: number;
    topic: string;
    count: string;
  }>(
    `SELECT year, topic, COUNT(*)::TEXT AS count
       FROM pyq_questions
      WHERE exam_id = $1 AND is_holdout = TRUE
      GROUP BY year, topic
      ORDER BY year DESC, topic`,
    [exam],
  );

  // Total count
  const { rows: totalRow } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::TEXT AS count FROM pyq_questions WHERE exam_id = $1 AND is_holdout = TRUE`,
    [exam],
  );
  const totalHoldout = parseInt(totalRow[0]?.count ?? '0', 10);

  // 28-day attempt + accuracy timeline (graceful fallback when sr_attempts missing)
  let timeline: Array<{ day: string; attempts: number; correct: number; accuracy: number }> = [];
  try {
    const { rows } = await pool.query<{
      day: string;
      attempts: string;
      correct: string;
    }>(
      `SELECT to_char(date_trunc('day', a.attempted_at), 'YYYY-MM-DD') AS day,
              COUNT(*)::TEXT AS attempts,
              SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::TEXT AS correct
         FROM sr_attempts a
         JOIN pyq_questions p ON p.id::TEXT = a.problem_id::TEXT
        WHERE p.is_holdout = TRUE
          AND p.exam_id = $1
          AND a.attempted_at >= NOW() - INTERVAL '28 days'
        GROUP BY 1
        ORDER BY 1`,
      [exam],
    );
    timeline = rows.map((r) => {
      const attempts = parseInt(r.attempts, 10);
      const correct = parseInt(r.correct, 10);
      return {
        day: r.day,
        attempts,
        correct,
        accuracy: attempts > 0 ? correct / attempts : 0,
      };
    });
  } catch {
    // sr_attempts table missing — surface empty timeline rather than 500
    timeline = [];
  }

  sendJSON(res, {
    exam_pack_id: exam,
    total_holdout: totalHoldout,
    stratification: stratification.map((r) => ({
      year: r.year,
      topic: r.topic,
      count: parseInt(r.count, 10),
    })),
    timeline_28d: timeline,
  });
}

/**
 * Per-PYQ listing for the holdout bank: shows attempts, accuracy, and
 * which curriculum_unit teaches the PYQ (if any).
 */
async function handlePyqList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const exam = req.query.get('exam');
  if (!exam) return badRequest(res, 'exam query param required');

  const pool = getPool();
  if (!pool) return;

  // Tolerant query — left-joins sr_attempts so PYQs with zero attempts
  // still appear. Falls back to a count-less listing if sr_attempts is absent.
  let withAttempts = true;
  let rows: Array<Record<string, unknown>> = [];
  try {
    const result = await pool.query(
      `SELECT p.id::TEXT AS id,
              p.year,
              p.topic,
              p.difficulty,
              p.taught_by_unit_id,
              COALESCE((
                SELECT COUNT(*)::INT
                  FROM sr_attempts a WHERE a.problem_id::TEXT = p.id::TEXT
              ), 0) AS attempts,
              COALESCE((
                SELECT COUNT(*) FILTER (WHERE a.is_correct)::INT
                  FROM sr_attempts a WHERE a.problem_id::TEXT = p.id::TEXT
              ), 0) AS correct
         FROM pyq_questions p
        WHERE p.exam_id = $1 AND p.is_holdout = TRUE
        ORDER BY p.year DESC, p.topic, p.id`,
      [exam],
    );
    rows = result.rows;
  } catch {
    withAttempts = false;
    const result = await pool.query(
      `SELECT id::TEXT AS id, year, topic, difficulty, taught_by_unit_id
         FROM pyq_questions
        WHERE exam_id = $1 AND is_holdout = TRUE
        ORDER BY year DESC, topic, id`,
      [exam],
    );
    rows = result.rows;
  }

  const pyqs = rows.map((r) => {
    const attempts = withAttempts ? Number(r.attempts ?? 0) : 0;
    const correct = withAttempts ? Number(r.correct ?? 0) : 0;
    return {
      id: r.id as string,
      year: r.year,
      topic: r.topic,
      difficulty: r.difficulty,
      taught_by_unit_id: r.taught_by_unit_id ?? null,
      attempts,
      correct,
      accuracy: attempts > 0 ? correct / attempts : null,
    };
  });

  sendJSON(res, { exam_pack_id: exam, count: pyqs.length, pyqs });
}

// ============================================================================
// Route table
// ============================================================================

export const adminHoldoutRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/holdout/summary', handler: handleSummary },
  { method: 'GET', path: '/api/admin/holdout/pyqs',    handler: handlePyqList },
];
