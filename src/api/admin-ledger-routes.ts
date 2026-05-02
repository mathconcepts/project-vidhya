/**
 * src/api/admin-ledger-routes.ts
 *
 * Admin REST endpoints for the Sprint C learnings ledger.
 *
 *   GET    /api/admin/ledger/runs          → recent ledger_runs rows
 *   POST   /api/admin/ledger/run-now       → trigger one nightly job synchronously
 *   GET    /api/admin/suggestions          → pending run_suggestions inbox
 *   POST   /api/admin/suggestions/:id      → action: 'launch' | 'dismiss'
 *
 * Auth: requireRole('admin') — same gate as the rest of /api/admin/*.
 */

import { ServerResponse } from 'http';
import pg from 'pg';
import { createRun } from '../generation/run-orchestrator';
import { runLearningsLedger } from '../jobs/learnings-ledger';
import type { GenerationRunConfig } from '../experiments/types';
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
// /api/admin/ledger/runs — list recent ledger_runs
// ============================================================================

async function handleListRuns(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const pool = getPool();
  if (!pool) return;
  const limit = Math.min(parseInt(req.query.get('limit') ?? '20', 10) || 20, 100);

  const { rows } = await pool.query(
    `SELECT id, ran_at, experiments_evaluated, promotions, demotions,
            suggestions, pr_url, status
       FROM ledger_runs
      ORDER BY ran_at DESC
      LIMIT $1`,
    [limit],
  );
  sendJSON(res, { runs: rows, count: rows.length });
}

// ============================================================================
// /api/admin/ledger/run-now — synchronous trigger (admin-only)
// ============================================================================

async function handleRunNow(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const body = (req.body ?? {}) as Record<string, unknown>;
  const result = await runLearningsLedger({
    no_pr: body.no_pr === true,
    force_pr: body.force_pr === true,
    no_digest: body.no_digest === true,
  });
  sendJSON(res, { result });
}

// ============================================================================
// /api/admin/suggestions — pending inbox
// ============================================================================

async function handleListSuggestions(
  req: ParsedRequest,
  res: ServerResponse,
): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const pool = getPool();
  if (!pool) return;
  const status = req.query.get('status') ?? 'pending';
  const exam = req.query.get('exam');

  const args: unknown[] = [status];
  let where = `status = $1`;
  if (exam) {
    args.push(exam);
    where += ` AND exam_pack_id = $${args.length}`;
  }

  const { rows } = await pool.query(
    `SELECT * FROM run_suggestions WHERE ${where} ORDER BY created_at DESC LIMIT 50`,
    args,
  );
  sendJSON(res, { suggestions: rows, count: rows.length });
}

// ============================================================================
// /api/admin/suggestions/:id — action: 'launch' | 'dismiss'
// ============================================================================

async function handleSuggestionAction(
  req: ParsedRequest,
  res: ServerResponse,
): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const id = req.params.id;
  if (!id) return badRequest(res, 'suggestion id required');

  const body = (req.body ?? {}) as Record<string, unknown>;
  const action = body.action;
  if (action !== 'launch' && action !== 'dismiss') {
    return badRequest(res, "action must be 'launch' or 'dismiss'");
  }

  const pool = getPool();
  if (!pool) return;

  if (action === 'dismiss') {
    await pool.query(
      `UPDATE run_suggestions SET status = 'dismissed', acted_at = NOW() WHERE id = $1`,
      [id],
    );
    return sendJSON(res, { ok: true });
  }

  // Launch — read the suggestion config and create a real GenerationRun
  const { rows } = await pool.query<{
    exam_pack_id: string;
    hypothesis: string;
    config: GenerationRunConfig;
    source_experiment_id: string | null;
  }>(
    `SELECT exam_pack_id, hypothesis, config, source_experiment_id
       FROM run_suggestions WHERE id = $1 AND status = 'pending'`,
    [id],
  );
  if (rows.length === 0) {
    return sendJSON(res, { error: 'Suggestion not found or already actioned' }, 404);
  }
  const s = rows[0];

  const run = await createRun({
    exam_pack_id: s.exam_pack_id,
    config: s.config,
    hypothesis: `[from suggestion ${id}] ${s.hypothesis}`,
    auto_experiment: true,
  });
  if (!run) {
    return sendJSON(res, { error: 'Failed to create run' }, 500);
  }

  await pool.query(
    `UPDATE run_suggestions SET status = 'launched', acted_at = NOW() WHERE id = $1`,
    [id],
  );

  sendJSON(res, { ok: true, run });
}

// ============================================================================
// Route table
// ============================================================================

export const adminLedgerRoutes: RouteDefinition[] = [
  { method: 'GET',  path: '/api/admin/ledger/runs',      handler: handleListRuns },
  { method: 'POST', path: '/api/admin/ledger/run-now',   handler: handleRunNow },
  { method: 'GET',  path: '/api/admin/suggestions',      handler: handleListSuggestions },
  { method: 'POST', path: '/api/admin/suggestions/:id',  handler: handleSuggestionAction },
];
