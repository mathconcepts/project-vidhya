/**
 * src/api/scoring-routes.ts — Phase 2 grading endpoints.
 *
 * Three surfaces, all gated:
 *
 *   POST /api/scoring/grade
 *     body: { student_response, item, student_id? }
 *     Grades a descriptive answer through the RubricGrader. Low-confidence
 *     grades route to the teacher queue (returned in the same payload).
 *
 *   GET  /api/admin/grading/queue?status=pending&limit=50
 *     Lists queued reviews (admin only).
 *
 *   POST /api/admin/grading/queue/:id/resolve
 *     body: { status: 'confirmed'|'corrected'|'dismissed', final_grade?, reviewer_notes? }
 *     Teacher resolves a review; confirmed/corrected feed the calibration set.
 *
 * Wiring topology (the Phase 2 deferred items now live):
 *   grade → RubricGrader(judge=RuntimeLLMJudge, cas=TieredCASChecker, onLowConfidence=enqueue)
 *   queue→ PgTeacherQueueRepo against grading_reviews (migration 029)
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { makeRubricGrader, MAX_RESPONSE_LENGTH } from '../scoring/rubric-grader';
import { makeRuntimeJudge, makeCASChecker } from '../scoring/adapters';
import { getTeacherQueueRepo } from '../scoring/teacher-queue-pg';
import { summarizeQueue } from '../scoring/teacher-queue';
import type { ItemContext, GradeResult } from '../core/interfaces';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ────────────────────────────────────────────────────────────────────
// POST /api/scoring/grade — open to students (their own work)
// ────────────────────────────────────────────────────────────────────

async function handleGrade(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body ?? {}) as Record<string, any>;
  const studentResponse: string = String(body.student_response ?? '');
  const item: ItemContext | undefined = body.item;
  const studentId: string | undefined = body.student_id;

  if (!studentResponse) {
    return sendJSON(res, { error: 'student_response is required' }, 400);
  }
  if (studentResponse.length > MAX_RESPONSE_LENGTH) {
    return sendJSON(
      res,
      { error: `student_response exceeds MAX_RESPONSE_LENGTH (${MAX_RESPONSE_LENGTH})` },
      413,
    );
  }
  if (!item || !item.rubric || !Array.isArray(item.rubric) || item.rubric.length === 0) {
    return sendJSON(res, { error: 'item.rubric is required (non-empty)' }, 400);
  }
  if (!Number.isFinite(item.maxMarks) || item.maxMarks <= 0) {
    return sendJSON(res, { error: 'item.maxMarks must be a positive number' }, 400);
  }

  const queue = getTeacherQueueRepo();
  let queuedReviewId: string | null = null;

  const grader = makeRubricGrader({
    judge: makeRuntimeJudge({ headers: req.headers as Record<string, string> }),
    cas: makeCASChecker({ topic: (body.topic as string) || undefined }),
    onLowConfidence: (_sid, grade) => {
      // Fire-and-forget enqueue. The id is captured for the response on resolution.
      void queue.enqueue({
        studentId: studentId ?? null,
        itemId: String(body.item_id ?? 'unknown'),
        studentResponse,
        proposedGrade: grade,
      }).then(r => { queuedReviewId = r.id; }).catch(() => { /* swallow — UX shouldn't fail on queue */ });
    },
  });

  let result: GradeResult;
  try {
    result = await grader.grade(studentResponse, item, { studentId });
  } catch (err) {
    return sendJSON(res, { error: (err as Error).message }, 500);
  }

  // Give the enqueue a moment to land before sending — the id is useful
  // for the student-facing "this is being reviewed" UI.
  await new Promise(r => setImmediate(r));

  return sendJSON(res, {
    grade: result,
    queued_for_review: queuedReviewId !== null,
    review_id: queuedReviewId,
  });
}

// ────────────────────────────────────────────────────────────────────
// GET /api/admin/grading/queue — admin only
// ────────────────────────────────────────────────────────────────────

async function handleQueueList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await requireRole(req, res, 'admin'))) return;
  const statusRaw = (req.query.get('status') ?? '').trim();
  const status = (['pending', 'confirmed', 'corrected', 'dismissed'] as const).find(s => s === statusRaw);
  const limit = Math.max(1, Math.min(500, parseInt(req.query.get('limit') ?? '100', 10) || 100));

  try {
    const repo = getTeacherQueueRepo();
    const rows = await repo.list({ status, limit });
    const health = summarizeQueue(rows);
    sendJSON(res, { rows, health });
  } catch (err) {
    sendJSON(res, { error: (err as Error).message }, 500);
  }
}

// ────────────────────────────────────────────────────────────────────
// POST /api/admin/grading/queue/:id/resolve — admin only
// ────────────────────────────────────────────────────────────────────

async function handleQueueResolve(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await requireRole(req, res, 'admin'))) return;
  // Pathname shape: /api/admin/grading/queue/<id>/resolve
  const match = /^\/api\/admin\/grading\/queue\/([^/]+)\/resolve$/.exec(req.pathname);
  if (!match) return sendJSON(res, { error: 'invalid path' }, 400);
  const id = match[1];

  const body = (req.body ?? {}) as Record<string, any>;
  const status = body.status as 'confirmed' | 'corrected' | 'dismissed';
  if (!['confirmed', 'corrected', 'dismissed'].includes(status)) {
    return sendJSON(res, { error: 'status must be one of confirmed|corrected|dismissed' }, 400);
  }
  const reviewerId = String((req as any).auth?.userId ?? body.reviewer_id ?? 'unknown');

  try {
    const repo = getTeacherQueueRepo();
    const updated = await repo.resolve(id, {
      status,
      finalGrade: body.final_grade as GradeResult | undefined,
      reviewerId,
      reviewerNotes: body.reviewer_notes as string | undefined,
    });
    sendJSON(res, { review: updated });
  } catch (err) {
    const msg = (err as Error).message;
    const code = /not found/.test(msg) ? 404 : 500;
    sendJSON(res, { error: msg }, code);
  }
}

export const scoringRoutes: RouteDefinition[] = [
  { method: 'POST', path: '/api/scoring/grade', handler: handleGrade },
  { method: 'GET', path: '/api/admin/grading/queue', handler: handleQueueList },
  { method: 'POST', path: '/api/admin/grading/queue/:id/resolve', handler: handleQueueResolve },
];
