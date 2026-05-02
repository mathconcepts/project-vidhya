/**
 * src/api/admin-experiments-routes.ts
 *
 * Admin REST endpoints for the experiment spine. Operator-facing surface
 * for the Content R&D Loop. Sprint B2: backend routes only — frontend
 * page lands in Sprint B3.
 *
 *   GET    /api/admin/experiments                  → list (filter by exam_pack_id, status)
 *   GET    /api/admin/experiments/:id              → single experiment + assignments
 *   POST   /api/admin/experiments                  → create
 *   PATCH  /api/admin/experiments/:id              → update status (won/lost/aborted/active)
 *   POST   /api/admin/experiments/:id/recompute-lift  → trigger lift_v1 recompute (sync)
 *   POST   /api/admin/experiments/:id/assignments  → batch assign targets
 *
 * Auth: requireRole('admin') — accepts EITHER a Supabase JWT whose user
 * has role='admin' in user_profiles, OR the CRON_SECRET bearer (backdoor
 * for curl/CI). Browsers use JWT; automation uses CRON_SECRET. Single
 * route surface, two principals, no embedded secrets in the frontend.
 */

import { ServerResponse } from 'http';
import {
  createExperiment,
  getExperiment,
  listExperiments,
  updateExperimentStatus,
  assignTarget,
  getAssignments,
} from '../experiments/registry';
import { computeLift } from '../experiments/lift';
import type { ExperimentStatus, AssignmentTargetKind } from '../experiments/types';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';

// ============================================================================
// Auth + helpers
// ============================================================================

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Admin-gated. Accepts EITHER:
 *   - A Supabase JWT whose user has role='admin' in user_profiles
 *   - The CRON_SECRET bearer (backdoor for curl/CI; supported by requireRole)
 * Returns null if rejected (response already sent).
 */
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

function isString(x: unknown): x is string {
  return typeof x === 'string' && x.length > 0;
}

// ============================================================================
// Handlers
// ============================================================================

async function handleList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const examPackId = req.query.get('exam') ?? undefined;
  const statusParam = req.query.get('status') ?? undefined;
  const limit = Math.min(parseInt(req.query.get('limit') ?? '100', 10) || 100, 500);

  const allowed: ExperimentStatus[] = ['active', 'won', 'lost', 'inconclusive', 'aborted'];
  const status =
    statusParam && allowed.includes(statusParam as ExperimentStatus)
      ? (statusParam as ExperimentStatus)
      : undefined;

  const experiments = await listExperiments({
    exam_pack_id: examPackId,
    status,
    limit,
  });

  sendJSON(res, { experiments, count: experiments.length });
}

async function handleGet(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const id = req.params.id;
  if (!isString(id)) return badRequest(res, 'experiment id required');

  const experiment = await getExperiment(id);
  if (!experiment) {
    sendJSON(res, { error: 'Not Found' }, 404);
    return;
  }
  const assignments = await getAssignments(id);
  sendJSON(res, { experiment, assignments });
}

async function handleCreate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const body = (req.body ?? {}) as Record<string, unknown>;
  if (!isString(body.name)) return badRequest(res, 'name required');
  if (!isString(body.exam_pack_id)) return badRequest(res, 'exam_pack_id required');

  const experiment = await createExperiment({
    id: typeof body.id === 'string' ? body.id : undefined,
    name: body.name,
    exam_pack_id: body.exam_pack_id,
    hypothesis: typeof body.hypothesis === 'string' ? body.hypothesis : undefined,
    variant_kind:
      body.variant_kind === 'atom' ||
      body.variant_kind === 'flag' ||
      body.variant_kind === 'gen_run' ||
      body.variant_kind === 'multi'
        ? body.variant_kind
        : undefined,
    metadata:
      body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : undefined,
  });

  if (!experiment) {
    sendJSON(res, { error: 'Failed to create experiment' }, 500);
    return;
  }
  sendJSON(res, { experiment }, 201);
}

async function handleUpdate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const id = req.params.id;
  if (!isString(id)) return badRequest(res, 'experiment id required');

  const body = (req.body ?? {}) as Record<string, unknown>;
  if (!isString(body.status)) return badRequest(res, 'status required');

  const allowed: ExperimentStatus[] = ['active', 'won', 'lost', 'inconclusive', 'aborted'];
  if (!allowed.includes(body.status as ExperimentStatus)) {
    return badRequest(res, `status must be one of: ${allowed.join(', ')}`);
  }

  const ok = await updateExperimentStatus(id, body.status as ExperimentStatus);
  if (!ok) {
    sendJSON(res, { error: 'Not Found' }, 404);
    return;
  }
  sendJSON(res, { ok: true });
}

async function handleRecomputeLift(
  req: ParsedRequest,
  res: ServerResponse,
): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const id = req.params.id;
  if (!isString(id)) return badRequest(res, 'experiment id required');

  const body = (req.body ?? {}) as Record<string, unknown>;
  const windowDays =
    typeof body.window_days === 'number' && body.window_days > 0
      ? Math.min(body.window_days, 90)
      : 7;

  const result = await computeLift(id, { window_days: windowDays, persist: true });
  if (!result) {
    sendJSON(res, { error: 'Not Found or DB unreachable' }, 404);
    return;
  }
  sendJSON(res, { result });
}

async function handleBatchAssign(
  req: ParsedRequest,
  res: ServerResponse,
): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;
  if (!requireDb(res)) return;

  const id = req.params.id;
  if (!isString(id)) return badRequest(res, 'experiment id required');

  const body = (req.body ?? {}) as Record<string, unknown>;
  const items = body.assignments;
  if (!Array.isArray(items) || items.length === 0) {
    return badRequest(res, 'assignments array required');
  }
  if (items.length > 1000) {
    return badRequest(res, 'too many assignments — max 1000 per request');
  }

  let written = 0;
  const errors: { index: number; reason: string }[] = [];
  const allowedKinds: AssignmentTargetKind[] = ['atom', 'flag', 'gen_run', 'session'];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;
    const kind = item.target_kind;
    const target = item.target_id;
    const variant = item.variant;
    if (!isString(kind) || !allowedKinds.includes(kind as AssignmentTargetKind)) {
      errors.push({ index: i, reason: 'invalid target_kind' });
      continue;
    }
    if (!isString(target)) {
      errors.push({ index: i, reason: 'invalid target_id' });
      continue;
    }
    if (!isString(variant)) {
      errors.push({ index: i, reason: 'invalid variant' });
      continue;
    }
    const ok = await assignTarget(id, kind as AssignmentTargetKind, target, variant);
    if (ok) written += 1;
    else errors.push({ index: i, reason: 'db write failed' });
  }

  sendJSON(res, { written, errors, total: items.length });
}

// ============================================================================
// Route table
// ============================================================================

export const adminExperimentsRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/experiments', handler: handleList },
  { method: 'GET', path: '/api/admin/experiments/:id', handler: handleGet },
  { method: 'POST', path: '/api/admin/experiments', handler: handleCreate },
  { method: 'PATCH', path: '/api/admin/experiments/:id', handler: handleUpdate },
  {
    method: 'POST',
    path: '/api/admin/experiments/:id/recompute-lift',
    handler: handleRecomputeLift,
  },
  {
    method: 'POST',
    path: '/api/admin/experiments/:id/assignments',
    handler: handleBatchAssign,
  },
];
