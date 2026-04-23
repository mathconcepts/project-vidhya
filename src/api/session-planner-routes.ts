// @ts-nocheck
/**
 * Session Planner API Routes
 *
 * Endpoints:
 *   POST /api/student/session/plan          — generate a plan for this student right now
 *   GET  /api/student/session/plans         — list this student's recent plans
 *   GET  /api/student/session/plans/:id     — get one plan by id
 *
 * Auth:
 *   All endpoints require a valid session (requireAuth). Students see
 *   only their own plans; the student_id in the plan is derived from
 *   the authenticated user id, not from the request body — so a
 *   malicious caller can't look up someone else's history.
 */

import type { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { requireAuth } from '../auth/middleware';
import {
  planSession, savePlan, getPlan, listPlansForStudent,
} from '../session-planner';
import type { PlanRequest } from '../session-planner';

// ============================================================================
// POST /api/student/session/plan
// ============================================================================

async function h_plan(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const body = (req.body ?? {}) as Partial<PlanRequest>;

  // Validate minutes_available — the only strictly required field.
  // Everything else has a sensible default or is optional.
  const rawMinutes = body.minutes_available;
  if (typeof rawMinutes !== 'number' || !Number.isFinite(rawMinutes) || rawMinutes <= 0) {
    return sendError(res, 400, 'minutes_available (positive number) is required');
  }
  if (rawMinutes > 180) {
    return sendError(res, 400, 'minutes_available must be ≤ 180');
  }

  if (!body.exam_id || typeof body.exam_id !== 'string') {
    return sendError(res, 400, 'exam_id (string) is required');
  }
  if (!body.exam_date || typeof body.exam_date !== 'string') {
    return sendError(res, 400, 'exam_date (ISO date string) is required');
  }
  const examDate = new Date(body.exam_date);
  if (isNaN(examDate.getTime())) {
    return sendError(res, 400, `exam_date '${body.exam_date}' is not a valid date`);
  }

  // Force student_id from the authenticated user — never trust the body.
  const request: PlanRequest = {
    student_id: auth.user.id,
    exam_id: body.exam_id,
    minutes_available: rawMinutes,
    exam_date: body.exam_date,
    topic_confidence: body.topic_confidence,
    diagnostic_scores: body.diagnostic_scores,
    sr_stats: body.sr_stats,
    weekly_hours: body.weekly_hours,
    trailing_7d_minutes: body.trailing_7d_minutes,
  };

  try {
    const plan = planSession(request);
    // Persist for audit + history. A planning failure is expected
    // never to happen post-validation; a store failure is logged but
    // shouldn't fail the response (the plan is still valid).
    try {
      savePlan(plan);
    } catch (err: any) {
      // Best-effort persistence; include the error so operators can see it.
      console.error('[session-planner] savePlan failed:', err.message ?? err);
    }
    sendJSON(res, plan);
  } catch (err: any) {
    sendError(res, 500, `Plan generation failed: ${err.message ?? String(err)}`);
  }
}

// ============================================================================
// GET /api/student/session/plans
// ============================================================================

async function h_list(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const limit = Math.min(50, Math.max(1, parseInt(req.query?.get('limit') ?? '20', 10) || 20));
  const plans = listPlansForStudent(auth.user.id, limit);
  sendJSON(res, { plans, count: plans.length });
}

// ============================================================================
// GET /api/student/session/plans/:id
// ============================================================================

async function h_get(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const id = req.params?.id;
  if (!id) return sendError(res, 400, 'id required');

  const plan = getPlan(id);
  if (!plan) return sendError(res, 404, `Plan '${id}' not found`);
  // Scope check — a student can only fetch their own plans.
  if (plan.request.student_id !== auth.user.id) {
    return sendError(res, 403, 'not authorized for this plan');
  }
  sendJSON(res, plan);
}

// ============================================================================
// Route registry
// ============================================================================

export const sessionPlannerRoutes: Array<{
  method: string;
  path: string;
  handler: RouteHandler;
}> = [
  { method: 'POST', path: '/api/student/session/plan',          handler: h_plan },
  { method: 'GET',  path: '/api/student/session/plans',         handler: h_list },
  { method: 'GET',  path: '/api/student/session/plans/:id',     handler: h_get },
];
