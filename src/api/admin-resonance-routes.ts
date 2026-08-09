/**
 * src/api/admin-resonance-routes.ts
 *
 * Admin REST surface for Resonance Score (Track E2).
 *
 *   GET  /api/admin/resonance/status        shadow mode status + top scores
 *   POST /api/admin/resonance/recompute     trigger nightly job (sync, admin)
 *
 * Rating micro-signal (open, requires auth):
 *   POST /api/lesson/atom-rating            { atom_id, rating: 1|-1 }
 *
 * Auth: admin routes require requireRole('admin'); atom-rating requires any auth.
 */

import pg from 'pg';
import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole, getAuth } from './auth-middleware';
import { runResonanceJob, recordAtomRating } from '../resonance/job';
import { checkShadowMode, SHADOW_MIN_WEEKS, SHADOW_MIN_TURNS } from '../resonance/resonance-v1';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

const { Pool } = pg;
let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, status: number, message: string): void {
  sendJSON(res, { error: message }, status);
}

async function parseBody(req: ParsedRequest): Promise<Record<string, unknown>> {
  return (req.body as Record<string, unknown>) ?? {};
}

export const adminResonanceRoutes: RouteDefinition[] = [
  // Shadow mode status + recent scores
  {
    method: 'GET',
    path: '/api/admin/resonance/status',
    handler: async (req, res) => {
      const user = await requireRole(req, res, 'admin');
      if (!user) return;

      const pool = getPool();
      if (!pool) {
        return sendJSON(res, {
          shadow_mode: { active: true, weeks_of_data: 0, total_scored_turns: 0, exit_criterion_met: false },
          recent_scores: [],
          note: 'DB-less — shadow mode always active',
        });
      }

      try {
        const turnsRes = await pool.query<{ turn_count: string; min_date: string }>(`
          SELECT COUNT(*) AS turn_count, MIN(created_at)::DATE AS min_date FROM chat_messages WHERE role = 'assistant'
        `);
        const row = turnsRes.rows[0];
        const turns = parseInt(row?.turn_count ?? '0', 10);
        const days = row?.min_date
          ? Math.floor((Date.now() - new Date(row.min_date).getTime()) / 86400000)
          : 0;
        const shadowStatus = checkShadowMode(Math.floor(days / 7), turns);

        const scoresRes = await pool.query(`
          SELECT atom_id, resonance_v1, n, shadow_mode, computed_at
          FROM atom_resonance
          WHERE resonance_v1 IS NOT NULL
          ORDER BY computed_at DESC
          LIMIT 20
        `).catch(() => ({ rows: [] }));

        sendJSON(res, {
          shadow_mode: shadowStatus,
          thresholds: { min_weeks: SHADOW_MIN_WEEKS, min_turns: SHADOW_MIN_TURNS },
          recent_scores: scoresRes.rows,
        });
      } catch (err) {
        sendError(res, 500, String(err));
      }
    },
  },

  // Trigger recompute
  {
    method: 'POST',
    path: '/api/admin/resonance/recompute',
    handler: async (req, res) => {
      const user = await requireRole(req, res, 'admin');
      if (!user) return;

      const pool = getPool();
      if (!pool) {
        return sendJSON(res, { note: 'DB-less — nothing to compute' });
      }

      const body = await parseBody(req);
      const windowDays = typeof body.window_days === 'number' ? body.window_days : 7;

      try {
        const result = await runResonanceJob(pool, { window_days: windowDays });
        sendJSON(res, result);
      } catch (err) {
        sendError(res, 500, String(err));
      }
    },
  },

  // Rating micro-signal (student-facing, any auth)
  {
    method: 'POST',
    path: '/api/lesson/atom-rating',
    handler: async (req, res) => {
      const auth = await getAuth(req);
      if (!auth?.userId) return sendError(res, 401, 'Authentication required');

      const body = await parseBody(req);
      const atomId = body.atom_id as string;
      const rating = body.rating as number;
      const sessionId = body.session_id as string | undefined;

      if (!atomId || typeof atomId !== 'string') {
        return sendError(res, 400, 'Missing atom_id');
      }
      if (rating !== 1 && rating !== -1) {
        return sendError(res, 400, 'rating must be 1 (Helped) or -1 (Didn\'t help)');
      }

      const pool = getPool();
      if (!pool) {
        return sendJSON(res, { ok: true, note: 'DB-less — rating not persisted' });
      }

      try {
        await recordAtomRating(pool, {
          atom_id: atomId,
          student_id: auth!.userId,
          session_id: sessionId,
          rating: rating as 1 | -1,
        });
        sendJSON(res, { ok: true });
      } catch (err) {
        console.warn('[atom-rating] failed:', err);
        sendJSON(res, { ok: false, note: 'Rating not persisted' });
      }
    },
  },
];
