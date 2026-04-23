// @ts-nocheck
/**
 * Session Planner API Routes
 *
 * Endpoints:
 *   POST /api/student/session/plan                    — generate a plan for this student right now
 *   POST /api/student/session/plan/multi-exam         — generate a multi-exam plan (v2.31)
 *   GET  /api/student/session/plans                   — list this student's recent plans
 *   GET  /api/student/session/plans/:id               — get one plan by id
 *   POST /api/student/session/plans/:id/complete      — record execution outcomes (v2.31)
 *
 * Auth:
 *   All endpoints require a valid session (requireAuth). Students see
 *   only their own plans; the student_id in the plan is derived from
 *   the authenticated user id, not from the request body — so a
 *   malicious caller can't look up someone else's history.
 *
 * trailing_7d_minutes (v2.31):
 *   Historically a client-supplied parameter. The HTTP layer now
 *   derives it from the student's completed plan executions in the
 *   last 7 days when the client omits it. Self-report is still
 *   honored when present (useful for first-time students with no
 *   execution history yet).
 */

import type { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { requireAuth } from '../auth/middleware';
import {
  planSession, planMultiExamSession,
  savePlan, getPlan, listPlansForStudent,
  recordExecution, sumTrailingMinutes, projectSrStatsFromExecutions,
  getProfile, upsertProfile,
  createTemplate, listTemplatesForStudent, getTemplate,
  deleteTemplate, markTemplateUsed,
  logPracticeSession,
} from '../session-planner';
import type {
  PlanRequest, MultiExamPlanRequest, PlanExecution, ActionOutcome,
} from '../session-planner';

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

  // Derive trailing_7d_minutes from execution history when the client
  // omits it. The client can still override with a self-reported value.
  const derivedTrailingMinutes = body.trailing_7d_minutes ??
    await sumTrailingMinutes(auth.user.id, 7);

  // If the client omitted sr_stats entirely, project from execution
  // history. This is the bootstrap path that makes the planner
  // self-sufficient without a separate gbrain call.
  let effectiveSrStats = body.sr_stats;
  if (!effectiveSrStats || effectiveSrStats.length === 0) {
    const projected = projectSrStatsFromExecutions(auth.user.id);
    if (projected.length > 0) {
      effectiveSrStats = projected;
    }
  }

  // Force student_id from the authenticated user — never trust the body.
  const request: PlanRequest = {
    student_id: auth.user.id,
    exam_id: body.exam_id,
    minutes_available: rawMinutes,
    exam_date: body.exam_date,
    topic_confidence: body.topic_confidence,
    diagnostic_scores: body.diagnostic_scores,
    sr_stats: effectiveSrStats,
    weekly_hours: body.weekly_hours,
    trailing_7d_minutes: derivedTrailingMinutes,
  };

  try {
    const plan = planSession(request);
    try {
      savePlan(plan);
    } catch (err: any) {
      console.error('[session-planner] savePlan failed:', err.message ?? err);
    }
    sendJSON(res, plan);
  } catch (err: any) {
    sendError(res, 500, `Plan generation failed: ${err.message ?? String(err)}`);
  }
}

// ============================================================================
// POST /api/student/session/plan/multi-exam  (v2.31)
// ============================================================================

async function h_planMultiExam(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const body = (req.body ?? {}) as Partial<MultiExamPlanRequest>;

  const rawMinutes = body.minutes_available;
  if (typeof rawMinutes !== 'number' || !Number.isFinite(rawMinutes) || rawMinutes <= 0) {
    return sendError(res, 400, 'minutes_available (positive number) is required');
  }
  if (rawMinutes > 180) {
    return sendError(res, 400, 'minutes_available must be ≤ 180');
  }

  if (!Array.isArray(body.exams) || body.exams.length === 0) {
    return sendError(res, 400, 'exams (non-empty array) is required');
  }
  if (body.exams.length > 5) {
    return sendError(res, 400, 'at most 5 concurrent exams supported');
  }
  for (const [i, e] of body.exams.entries()) {
    if (!e.exam_id || typeof e.exam_id !== 'string') {
      return sendError(res, 400, `exams[${i}].exam_id is required`);
    }
    if (!e.exam_date || isNaN(new Date(e.exam_date).getTime())) {
      return sendError(res, 400, `exams[${i}].exam_date is required and must be a valid ISO date`);
    }
  }

  const derivedTrailingMinutes = body.trailing_7d_minutes ??
    await sumTrailingMinutes(auth.user.id, 7);

  const request: MultiExamPlanRequest = {
    student_id: auth.user.id,
    minutes_available: rawMinutes,
    exams: body.exams,
    weekly_hours: body.weekly_hours,
    trailing_7d_minutes: derivedTrailingMinutes,
  };

  try {
    const plan = planMultiExamSession(request);
    try {
      savePlan(plan);
    } catch (err: any) {
      console.error('[session-planner] savePlan failed:', err.message ?? err);
    }
    sendJSON(res, plan);
  } catch (err: any) {
    sendError(res, 500, `Multi-exam plan generation failed: ${err.message ?? String(err)}`);
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
// POST /api/student/session/plans/:id/complete  (v2.31)
// ============================================================================

async function h_complete(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const id = req.params?.id;
  if (!id) return sendError(res, 400, 'id required');

  const body = (req.body ?? {}) as Partial<PlanExecution>;

  if (typeof body.actual_minutes_spent !== 'number' || body.actual_minutes_spent < 0) {
    return sendError(res, 400, 'actual_minutes_spent (non-negative number) is required');
  }
  if (!Array.isArray(body.actions_completed)) {
    return sendError(res, 400, 'actions_completed (array) is required');
  }

  // Validate each outcome shape — reject the whole request on any bad
  // entry so the stored record is always coherent.
  for (const [i, o] of body.actions_completed.entries()) {
    if (!o || typeof o.action_id !== 'string' || !o.action_id) {
      return sendError(res, 400, `actions_completed[${i}].action_id is required`);
    }
    if (typeof o.completed !== 'boolean') {
      return sendError(res, 400, `actions_completed[${i}].completed (boolean) is required`);
    }
    if (o.attempts !== undefined && (typeof o.attempts !== 'number' || o.attempts < 0)) {
      return sendError(res, 400, `actions_completed[${i}].attempts must be non-negative number`);
    }
    if (o.correct !== undefined && (typeof o.correct !== 'number' || o.correct < 0)) {
      return sendError(res, 400, `actions_completed[${i}].correct must be non-negative number`);
    }
    if (o.correct !== undefined && o.attempts !== undefined && o.correct > o.attempts) {
      return sendError(res, 400, `actions_completed[${i}].correct cannot exceed attempts`);
    }
  }

  const execution: PlanExecution = {
    completed_at: new Date().toISOString(),
    actual_minutes_spent: body.actual_minutes_spent,
    actions_completed: body.actions_completed as ActionOutcome[],
    session_note: body.session_note,
  };

  try {
    const updated = recordExecution(id, auth.user.id, execution);
    // v2.32: mirror into the practice-session log so trailing
    // minutes reflects this execution even for non-plan callers.
    // plan_id is set so the union in sumTrailingMinutes doesn't
    // double-count.
    try {
      logPracticeSession({
        student_id: auth.user.id,
        minutes: execution.actual_minutes_spent,
        completed_at: execution.completed_at,
        source: 'plan-execution',
        plan_id: id,
      });
    } catch (err: any) {
      console.error('[session-planner] practice-log mirror failed:', err.message);
    }
    sendJSON(res, updated);
  } catch (err: any) {
    const msg = err.message ?? String(err);
    if (msg.includes('not found')) return sendError(res, 404, msg);
    if (msg.includes('does not belong')) return sendError(res, 403, msg);
    sendError(res, 500, msg);
  }
}

// ============================================================================
// v2.32 — Student exam profile (Item 1)
// ============================================================================

async function h_getProfile(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const profile = getProfile(auth.user.id);
  // Always return a shape — empty-exams is the "new student" state.
  sendJSON(res, profile ?? {
    student_id: auth.user.id, exams: [], updated_at: new Date().toISOString(),
  });
}

async function h_upsertProfile(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body ?? {}) as { exams?: any[] };
  if (!Array.isArray(body.exams)) {
    return sendError(res, 400, 'exams (array) required');
  }
  if (body.exams.length > 5) {
    return sendError(res, 400, 'at most 5 concurrent exams');
  }
  const nowIso = new Date().toISOString();
  const sanitized = body.exams.map((e: any, i: number) => {
    if (!e.exam_id || typeof e.exam_id !== 'string') {
      throw new Error(`exams[${i}].exam_id required`);
    }
    if (!e.exam_date || isNaN(new Date(e.exam_date).getTime())) {
      throw new Error(`exams[${i}].exam_date must be a valid ISO date`);
    }
    return {
      exam_id: e.exam_id,
      exam_date: e.exam_date,
      weekly_hours: typeof e.weekly_hours === 'number' ? e.weekly_hours : undefined,
      topic_confidence: e.topic_confidence,
      added_at: e.added_at ?? nowIso,
    };
  });
  try {
    const profile = upsertProfile(auth.user.id, sanitized);
    sendJSON(res, profile);
  } catch (err: any) {
    sendError(res, 400, err.message ?? String(err));
  }
}

// ============================================================================
// v2.32 — Plan templates (Item 7)
// ============================================================================

async function h_listTemplates(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const templates = listTemplatesForStudent(auth.user.id);
  sendJSON(res, { templates, count: templates.length });
}

async function h_createTemplate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body ?? {}) as any;
  if (!body.name || typeof body.name !== 'string' || body.name.length > 60) {
    return sendError(res, 400, 'name (1-60 char string) required');
  }
  if (typeof body.minutes_available !== 'number' ||
      body.minutes_available < 1 || body.minutes_available > 180) {
    return sendError(res, 400, 'minutes_available (1-180) required');
  }
  const exam_selection = body.exam_selection;
  const selectionValid =
    exam_selection === 'all' || exam_selection === 'primary' ||
    (Array.isArray(exam_selection) && exam_selection.every((x: any) => typeof x === 'string'));
  if (!selectionValid) {
    return sendError(res, 400, 'exam_selection must be "all" | "primary" | string[]');
  }
  try {
    const t = createTemplate(auth.user.id, {
      name: body.name,
      minutes_available: body.minutes_available,
      exam_selection,
      weekly_hours: body.weekly_hours,
    });
    sendJSON(res, t);
  } catch (err: any) {
    sendError(res, 400, err.message ?? String(err));
  }
}

async function h_deleteTemplate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const id = req.params?.id;
  if (!id) return sendError(res, 400, 'id required');
  try {
    const ok = deleteTemplate(id, auth.user.id);
    if (!ok) return sendError(res, 404, `Template '${id}' not found`);
    sendJSON(res, { deleted: true, id });
  } catch (err: any) {
    const msg = err.message ?? String(err);
    if (msg.includes('does not belong')) return sendError(res, 403, msg);
    sendError(res, 500, msg);
  }
}

/**
 * Recall a template → run the planner → return the resulting plan.
 * This is the one-tap "fire my morning commute template" path.
 */
async function h_useTemplate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const id = req.params?.id;
  if (!id) return sendError(res, 400, 'id required');

  const t = getTemplate(id);
  if (!t) return sendError(res, 404, `Template '${id}' not found`);
  if (t.student_id !== auth.user.id) {
    return sendError(res, 403, 'not authorized for this template');
  }

  // Resolve exam selection against the student's registered profile.
  const profile = getProfile(auth.user.id);
  if (!profile || profile.exams.length === 0) {
    return sendError(res, 400,
      'Template requires at least one exam registered via /api/student/profile');
  }

  let exams = profile.exams;
  if (t.exam_selection === 'primary') {
    exams = [exams.slice().sort((a, b) =>
      a.exam_date.localeCompare(b.exam_date))[0]];
  } else if (Array.isArray(t.exam_selection)) {
    const wanted = new Set(t.exam_selection);
    exams = exams.filter(e => wanted.has(e.exam_id));
    if (exams.length === 0) {
      return sendError(res, 400,
        `None of the template's exam_ids match the student's registered exams`);
    }
  }
  // else 'all' → use the full profile

  const derivedTrailing = await sumTrailingMinutes(auth.user.id, 7);
  const now = new Date();

  try {
    let plan;
    if (exams.length === 1) {
      const e = exams[0];
      plan = planSession({
        student_id: auth.user.id,
        exam_id: e.exam_id,
        exam_date: e.exam_date,
        minutes_available: t.minutes_available,
        topic_confidence: e.topic_confidence,
        weekly_hours: t.weekly_hours ?? e.weekly_hours,
        trailing_7d_minutes: derivedTrailing,
        sr_stats: projectSrStatsFromExecutions(auth.user.id, now),
        now,
      });
    } else {
      plan = planMultiExamSession({
        student_id: auth.user.id,
        minutes_available: t.minutes_available,
        exams: exams.map(e => ({
          exam_id: e.exam_id,
          exam_date: e.exam_date,
          topic_confidence: e.topic_confidence,
        })),
        weekly_hours: t.weekly_hours,
        trailing_7d_minutes: derivedTrailing,
        now,
      });
    }
    try { savePlan(plan); } catch (err: any) {
      console.error('[session-planner] savePlan after template failed:', err.message);
    }
    try { markTemplateUsed(t.id); } catch {}
    sendJSON(res, { template_id: t.id, plan });
  } catch (err: any) {
    sendError(res, 500, `Template recall failed: ${err.message ?? String(err)}`);
  }
}

// ============================================================================
// v2.32 — Practice session log (Item 4)
// ============================================================================

async function h_logPractice(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body ?? {}) as any;
  if (typeof body.minutes !== 'number' || body.minutes < 0 || body.minutes > 300) {
    return sendError(res, 400, 'minutes (0-300) required');
  }
  const source = body.source && typeof body.source === 'string' ? body.source : 'other';
  try {
    logPracticeSession({
      student_id: auth.user.id,
      minutes: body.minutes,
      completed_at: body.completed_at ?? new Date().toISOString(),
      source,
      plan_id: body.plan_id,
    });
    sendJSON(res, { logged: true });
  } catch (err: any) {
    sendError(res, 500, err.message ?? String(err));
  }
}

// ============================================================================
// v2.32 — Student OpenAPI spec (Item 3)
// ============================================================================

async function h_openapi(req: ParsedRequest, res: ServerResponse): Promise<void> {
  // The spec itself is public — the routes it describes all require
  // auth, and the spec contains no secrets.
  const { buildStudentOpenAPISpec } = await import('./student-openapi');
  const host = (req.headers?.host as string) ?? 'localhost:8080';
  const proto = req.headers?.['x-forwarded-proto'] ?? 'http';
  const baseUrl = `${proto}://${host}`;
  sendJSON(res, buildStudentOpenAPISpec(baseUrl));
}

// ============================================================================
// Route registry
// ============================================================================

export const sessionPlannerRoutes: Array<{
  method: string;
  path: string;
  handler: RouteHandler;
}> = [
  // Plan generation + history (v2.30-v2.31)
  { method: 'POST', path: '/api/student/session/plan',                    handler: h_plan },
  { method: 'POST', path: '/api/student/session/plan/multi-exam',         handler: h_planMultiExam },
  { method: 'GET',  path: '/api/student/session/plans',                   handler: h_list },
  { method: 'GET',  path: '/api/student/session/plans/:id',               handler: h_get },
  { method: 'POST', path: '/api/student/session/plans/:id/complete',      handler: h_complete },

  // Exam profile (v2.32, Item 1)
  { method: 'GET',  path: '/api/student/profile',                         handler: h_getProfile },
  { method: 'PUT',  path: '/api/student/profile',                         handler: h_upsertProfile },

  // Plan templates (v2.32, Item 7)
  { method: 'GET',  path: '/api/student/session/templates',               handler: h_listTemplates },
  { method: 'POST', path: '/api/student/session/templates',               handler: h_createTemplate },
  { method: 'DELETE', path: '/api/student/session/templates/:id',         handler: h_deleteTemplate },
  { method: 'POST', path: '/api/student/session/templates/:id/use',       handler: h_useTemplate },

  // Practice session log (v2.32, Item 4)
  { method: 'POST', path: '/api/student/session/practice-log',            handler: h_logPractice },

  // OpenAPI spec for Swagger UI (v2.32, Item 3) — public, no auth
  { method: 'GET',  path: '/api/student/openapi.json',                    handler: h_openapi },
];
