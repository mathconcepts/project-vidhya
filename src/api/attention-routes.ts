// @ts-nocheck
/**
 * Attention HTTP surface — lets the app UI + admins consult the
 * attention primitive before a session starts.
 *
 * Student endpoints (authenticated):
 *   POST /api/attention/resolve
 *        body: { minutes_available }
 *        → AttentionStrategy for this student right now, factoring in
 *          their trailing-7d coverage
 *
 *   POST /api/attention/record-session
 *        body: { minutes_spent }
 *        → updated CumulativeCoverage; called after any interaction
 *
 *   GET  /api/attention/coverage
 *        → current CumulativeCoverage for this student
 *
 * Admin endpoints:
 *   GET  /api/admin/attention/overdue-deferrals/:user_id?threshold=N
 *        → list of (topic, difficulty) pairs this student has been
 *          avoiding due to short sessions; threshold controls
 *          promotion eligibility
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireAuth, requireRole } from '../auth/middleware';
import {
  budgetFromMinutes, resolveStrategy,
  recordSession, getCoverage, getOverdueDeferrals,
} from '../attention';

// ============================================================================

async function handleResolve(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (typeof body.minutes_available !== 'number' || body.minutes_available <= 0) {
    return sendError(res, 400, 'minutes_available (positive number) required');
  }
  const coverage = getCoverage(auth.user.id);
  const budget = budgetFromMinutes(
    body.minutes_available,
    'student_declared',
    coverage?.trailing_7d_sessions ? coverage.trailing_7d_minutes / coverage.trailing_7d_sessions : undefined,
  );
  const strategy = resolveStrategy(budget, coverage ?? undefined);
  sendJSON(res, { strategy, coverage });
}

async function handleRecordSession(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (typeof body.minutes_spent !== 'number' || body.minutes_spent <= 0) {
    return sendError(res, 400, 'minutes_spent (positive number) required');
  }
  const updated = await recordSession(auth.user.id, body.minutes_spent);
  sendJSON(res, { coverage: updated });
}

async function handleGetCoverage(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const coverage = getCoverage(auth.user.id);
  sendJSON(res, { coverage });
}

async function handleOverdueDeferrals(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const threshold = Number(req.query.get('threshold') ?? 3);
  sendJSON(res, { deferrals: getOverdueDeferrals(req.params.user_id, threshold) });
}

// ============================================================================

export const attentionRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'POST', path: '/api/attention/resolve',          handler: handleResolve },
  { method: 'POST', path: '/api/attention/record-session',   handler: handleRecordSession },
  { method: 'GET',  path: '/api/attention/coverage',         handler: handleGetCoverage },
  { method: 'GET',  path: '/api/admin/attention/overdue-deferrals/:user_id', handler: handleOverdueDeferrals },
];
