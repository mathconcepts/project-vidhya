// @ts-nocheck
/**
 * Feedback Routes — student submit + admin triage/approve/apply surface.
 *
 * Generic across exams. All routes take exam_id in params or body.
 *
 * Student-facing (authenticated):
 *   POST   /api/feedback/submit                       Submit new feedback
 *   GET    /api/feedback/mine                         List my submitted feedback
 *   GET    /api/feedback/:id                          Get one feedback item
 *
 * Admin-facing (admin role):
 *   GET    /api/admin/feedback/dashboard/:exam_id     Dashboard aggregate
 *   GET    /api/admin/feedback/list                   List all (with filters)
 *   POST   /api/admin/feedback/:id/triage             Set priority + kind
 *   POST   /api/admin/feedback/:id/approve            Approve
 *   POST   /api/admin/feedback/:id/reject             Reject with reason
 *   POST   /api/admin/feedback/:id/duplicate          Mark as duplicate
 *   POST   /api/admin/feedback/propose-patch          Build a ScopePatch from approved items
 *   POST   /api/admin/feedback/preview-patch          Dry-run a patch against exam content
 *   POST   /api/admin/feedback/:id/apply              Mark applied + record change
 *
 * Public (no auth — transparency):
 *   GET    /api/feedback/applied/:exam_id             Recent applied changes for an exam
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireAuth, requireRole } from '../auth/middleware';
import {
  submitFeedback,
  listFeedback,
  getFeedback,
  listAppliedChanges,
  triageFeedback,
  approveFeedback,
  rejectFeedback,
  markDuplicate,
  applyFeedback,
  buildDashboard,
} from '../feedback/store';
import {
  proposePatch,
  previewPatch,
  applyPatch,
  type ExamContent,
  type ScopePatch,
} from '../feedback/scope-applicator';
import {
  BITSAT_EXAM,
  LESSON_LIMITS,
  BITSAT_MOCK_EXAM,
  BITSAT_STRATEGIES,
} from '../samples/bitsat-mathematics';

// ============================================================================
// Student-facing
// ============================================================================

async function handleSubmit(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.kind || !body.target?.exam_id || !body.description) {
    return sendError(res, 400, 'kind, target.exam_id, and description are required');
  }
  try {
    const item = submitFeedback({
      kind: body.kind,
      target: body.target,
      description: body.description,
      suggestion: body.suggestion,
      evidence: body.evidence,
      submitted_by: {
        user_id: auth.user.id,
        display_name: body.display_name,
        anonymous: Boolean(body.anonymous),
      },
    });
    sendJSON(res, {
      item,
      thanks:
        'Your feedback is recorded. You\'ll see it in /api/feedback/mine with status updates as it moves through triage, approval, and application.',
    });
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
}

async function handleMine(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const items = listFeedback({ user_id: auth.user.id });
  sendJSON(res, {
    items,
    count_by_status: items.reduce((acc: any, i) => {
      acc[i.status] = (acc[i.status] ?? 0) + 1;
      return acc;
    }, {}),
  });
}

async function handleGet(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const item = getFeedback(req.params.id);
  if (!item) return sendError(res, 404, 'feedback not found');
  // Students can view their own; admins can view any
  if (item.submitted_by.user_id !== auth.user.id && auth.user.role !== 'admin') {
    return sendError(res, 403, 'Not your feedback');
  }
  sendJSON(res, { item });
}

async function handleAppliedPublic(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const exam_id = req.params.exam_id;
  const changes = listAppliedChanges(exam_id);
  sendJSON(res, { exam_id, changes });
}

// ============================================================================
// Admin-facing
// ============================================================================

async function handleDashboard(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  sendJSON(res, { dashboard: buildDashboard(req.params.exam_id) });
}

async function handleAdminList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const filter = {
    exam_id: req.query.get('exam_id') || undefined,
    status: (req.query.get('status') as any) || undefined,
    kind: (req.query.get('kind') as any) || undefined,
    priority: (req.query.get('priority') as any) || undefined,
  };
  sendJSON(res, { items: listFeedback(filter) });
}

async function handleTriage(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.priority) return sendError(res, 400, 'priority required');
  const item = triageFeedback(req.params.id, auth.user.id, body.priority, body.admin_notes);
  if (!item) return sendError(res, 404, 'feedback not found');
  sendJSON(res, { item });
}

async function handleApprove(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  const item = approveFeedback(req.params.id, auth.user.id, body.admin_notes);
  if (!item) return sendError(res, 404, 'feedback not found');
  sendJSON(res, { item });
}

async function handleReject(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.reason) return sendError(res, 400, 'reason required');
  const item = rejectFeedback(req.params.id, auth.user.id, body.reason);
  if (!item) return sendError(res, 404, 'feedback not found');
  sendJSON(res, { item });
}

async function handleDuplicate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.canonical_id) return sendError(res, 400, 'canonical_id required');
  const item = markDuplicate(req.params.id, body.canonical_id, auth.user.id);
  if (!item) return sendError(res, 404, 'feedback not found');
  sendJSON(res, { item });
}

async function handleProposePatch(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!Array.isArray(body.feedback_ids) || body.feedback_ids.length === 0) {
    return sendError(res, 400, 'feedback_ids array required');
  }
  const items = body.feedback_ids.map((id: string) => getFeedback(id)).filter(Boolean);
  if (items.length === 0) return sendError(res, 404, 'no feedback items found for given ids');
  try {
    const patch = proposePatch(items as any, auth.user.id);
    if (!patch) return sendError(res, 400, 'no applicable ops could be generated from these items');
    sendJSON(res, { patch });
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
}

async function handlePreviewPatch(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.patch || !body.patch.exam_id) return sendError(res, 400, 'patch object required in body');

  // Load content for the exam. BITSAT sample uses the static content;
  // future exams can register their own content loader.
  const content = loadExamContent(body.patch.exam_id);
  if (!content) return sendError(res, 404, `no content loader registered for ${body.patch.exam_id}`);

  const result = previewPatch(content, body.patch as ScopePatch);
  sendJSON(res, {
    exam_id: body.patch.exam_id,
    report: result.report,
    would_apply_preview: {
      exam_topic_weights: result.would_apply.exam.topic_weights,
      syllabus_count: result.would_apply.exam.syllabus?.length,
      mock_question_counts: result.would_apply.mocks.map(m => ({ id: m.id, questions: m.questions.length })),
      strategy_count: result.would_apply.strategies.length,
    },
  });
}

async function handleApply(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.release_tag || !body.change_description) {
    return sendError(res, 400, 'release_tag and change_description required');
  }
  const result = applyFeedback(
    req.params.id,
    auth.user.id,
    body.release_tag,
    body.change_description,
    body.diff_summary,
  );
  if (!result) return sendError(res, 404, 'feedback not found or not in approved status');
  sendJSON(res, result);
}

// ============================================================================
// Exam content loader — maps exam_id to ExamContent
//
// Each exam registered in the dynamic system can register a content
// loader here. BITSAT is shown; future exams follow the same pattern.
// ============================================================================

function loadExamContent(exam_id: string): ExamContent | null {
  if (exam_id === BITSAT_EXAM.id) {
    return {
      exam: BITSAT_EXAM,
      mocks: [BITSAT_MOCK_EXAM],
      lessons: [LESSON_LIMITS],
      strategies: [...BITSAT_STRATEGIES.strategies.map(s => ({
        title: s.title,
        content: s.content,
        evidence: s.evidence,
      }))],
    };
  }
  // Future exams: GATE, NEET, JEE, etc. register here as they're added.
  return null;
}

// ============================================================================

export const feedbackRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  // Student-facing
  { method: 'POST', path: '/api/feedback/submit',                    handler: handleSubmit },
  { method: 'GET',  path: '/api/feedback/mine',                      handler: handleMine },
  { method: 'GET',  path: '/api/feedback/:id',                       handler: handleGet },
  { method: 'GET',  path: '/api/feedback/applied/:exam_id',          handler: handleAppliedPublic },

  // Admin-facing
  { method: 'GET',  path: '/api/admin/feedback/dashboard/:exam_id',  handler: handleDashboard },
  { method: 'GET',  path: '/api/admin/feedback/list',                handler: handleAdminList },
  { method: 'POST', path: '/api/admin/feedback/:id/triage',          handler: handleTriage },
  { method: 'POST', path: '/api/admin/feedback/:id/approve',         handler: handleApprove },
  { method: 'POST', path: '/api/admin/feedback/:id/reject',          handler: handleReject },
  { method: 'POST', path: '/api/admin/feedback/:id/duplicate',       handler: handleDuplicate },
  { method: 'POST', path: '/api/admin/feedback/propose-patch',       handler: handleProposePatch },
  { method: 'POST', path: '/api/admin/feedback/preview-patch',       handler: handlePreviewPatch },
  { method: 'POST', path: '/api/admin/feedback/:id/apply',           handler: handleApply },
];
