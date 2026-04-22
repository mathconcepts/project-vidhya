// @ts-nocheck
/**
 * SampleCheck Workflow HTTP surface
 *
 * Admin endpoints (admin role):
 *   POST /api/admin/sample-check                      Create new iteration
 *   GET  /api/admin/sample-check/list                 List all samples (with filters)
 *   GET  /api/admin/sample-check/:id                  Full sample with stats
 *   GET  /api/admin/sample-check/exam/:exam_id        All iterations for an exam
 *   POST /api/admin/sample-check/:id/close-resolved   Close when all feedback resolved
 *   POST /api/admin/sample-check/:id/supersede        Close + optionally link to new id
 *   POST /api/admin/sample-check/:id/carry-forward    Decide on unresolved items
 *                                                     when opening next iteration
 *   POST /api/admin/sample-check/cross-exam-link      Manually create cross-exam link
 *   POST /api/admin/sample-check/suggest-cross-links  GBrain suggestions for a feedback
 *   POST /api/admin/cross-exam-link/:id/:action       ack|decline|apply from target side
 *   GET  /api/admin/cross-exam-link/incoming/:exam_id Incoming links for target exam
 *
 * Student endpoints (authenticated):
 *   POST /api/sample-check/:id/feedback               Submit feedback against this sample
 *
 * Public endpoints (no auth):
 *   GET  /s/:token                                    Public sample view
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireAuth, requireRole } from '../auth/middleware';
import {
  createSampleCheck,
  closeSampleSuperseded,
  closeSampleResolved,
  getSampleCheck,
  getSampleByToken,
  listSamplesForExam,
  getLatestOpenSample,
  getIterationChain,
  listIterationsForExam,
  carryForwardDecision,
  createCrossExamLink,
  updateCrossLinkStatus,
  listCrossLinksIncomingFor,
  listCrossLinksFromFeedback,
  suggestCrossExamLinks,
  buildPublicView,
  updateStatsInStore,
} from '../sample-check/store';
import { submitFeedback, listFeedback } from '../feedback/store';
import {
  BITSAT_EXAM, BITSAT_MOCK_EXAM, LESSON_LIMITS, BITSAT_STRATEGIES,
} from '../samples/bitsat-mathematics';

// ============================================================================
// Exam content loader — maps exam_id to current live ExamContent + name
// Shared with feedback-routes.ts (same pattern). Extend here when adding
// new exams (GATE/JEE/NEET/UPSC).
// ============================================================================

function loadExamContentAndName(exam_id: string): { content: any; name: string; code: string } | null {
  if (exam_id === BITSAT_EXAM.id) {
    return {
      name: BITSAT_EXAM.name,
      code: BITSAT_EXAM.code,
      content: {
        exam: BITSAT_EXAM,
        mocks: [BITSAT_MOCK_EXAM],
        lessons: [LESSON_LIMITS],
        strategies: BITSAT_STRATEGIES.strategies.map(s => ({
          title: s.title, content: s.content, evidence: s.evidence,
        })),
      },
    };
  }
  return null;
}

// ============================================================================
// Admin — create / list / close / iterate
// ============================================================================

async function handleCreate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.exam_id || !body.admin_note) {
    return sendError(res, 400, 'exam_id and admin_note required');
  }
  const loaded = loadExamContentAndName(body.exam_id);
  if (!loaded) return sendError(res, 404, `No content loader registered for ${body.exam_id}`);

  // Deep-copy the current content as the frozen snapshot
  const snapshot = JSON.parse(JSON.stringify(loaded.content));

  try {
    const sample = createSampleCheck({
      exam_id: body.exam_id,
      exam_code: loaded.code,
      exam_name: loaded.name,
      snapshot,
      admin_note: body.admin_note,
      created_by: auth.user.id,
      release_tag: body.release_tag,
    });
    sendJSON(res, {
      sample_check: sample,
      share_url: `/s/${sample.share_token}`,
      note:
        `Iteration ${sample.iteration} is live. Share /s/${sample.share_token} ` +
        `with students. Feedback submissions bind to this specific iteration.`,
    });
  } catch (err) {
    sendError(res, 409, (err as Error).message);
  }
}

async function handleAdminList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const exam_id = req.query.get('exam_id');
  const status = req.query.get('status');
  const all = exam_id
    ? listSamplesForExam(exam_id)
    : listSamplesForExam('') /* empty returns nothing; admin should filter */;
  const filtered = status ? all.filter(s => s.status === status) : all;
  sendJSON(res, { samples: filtered });
}

async function handleGetSample(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const s = getSampleCheck(req.params.id);
  if (!s) return sendError(res, 404, 'Sample check not found');
  updateStatsInStore(s);
  const chain = getIterationChain(s.id);
  const iterations = listIterationsForExam(s.exam_id);
  sendJSON(res, { sample_check: s, iteration_chain: chain, all_iterations: iterations });
}

async function handleExamSamples(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const exam_id = req.params.exam_id;
  const samples = listSamplesForExam(exam_id);
  const iterations = listIterationsForExam(exam_id);
  const latest_open = getLatestOpenSample(exam_id);
  sendJSON(res, { samples, iterations, latest_open });
}

async function handleCloseResolved(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  try {
    const s = closeSampleResolved(req.params.id, auth.user.id);
    if (!s) return sendError(res, 404, 'Sample check not found');
    sendJSON(res, { sample_check: s });
  } catch (err) {
    sendError(res, 409, (err as Error).message);
  }
}

async function handleSupersede(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  const s = closeSampleSuperseded(req.params.id, auth.user.id, body.superseded_by_sample_id);
  if (!s) return sendError(res, 404, 'Sample check not found');
  sendJSON(res, { sample_check: s });
}

async function handleCarryForward(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.iteration_id || !body.feedback_id || !body.decision || !body.rationale) {
    return sendError(res, 400, 'iteration_id, feedback_id, decision, rationale required');
  }
  if (!['carried_forward', 'resolved_applied', 'resolved_obsolete'].includes(body.decision)) {
    return sendError(res, 400, 'decision must be carried_forward | resolved_applied | resolved_obsolete');
  }
  const it = carryForwardDecision(body.iteration_id, body.feedback_id, body.decision, body.rationale);
  if (!it) return sendError(res, 404, 'Iteration not found');
  sendJSON(res, { iteration: it });
}

// ============================================================================
// Admin — cross-exam links
// ============================================================================

async function handleCreateCrossLink(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.source_feedback_id || !body.target_exam_id || !body.rationale) {
    return sendError(res, 400, 'source_feedback_id, target_exam_id, rationale required');
  }
  const link = createCrossExamLink({
    source_feedback_id: body.source_feedback_id,
    target_exam_id: body.target_exam_id,
    rationale: body.rationale,
    created_by: auth.user.id,
    gbrain_signals: body.gbrain_signals,
  });
  if (!link) return sendError(res, 400, 'Failed to create cross-exam link (invalid source feedback or self-link)');
  sendJSON(res, { link });
}

async function handleSuggestCrossLinks(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.feedback_id || !Array.isArray(body.candidate_exam_ids)) {
    return sendError(res, 400, 'feedback_id and candidate_exam_ids array required');
  }
  const suggestions = await suggestCrossExamLinks(body.feedback_id, body.candidate_exam_ids);
  sendJSON(res, { suggestions });
}

async function handleCrossLinkAction(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const { id, action } = req.params;
  if (!['acknowledge', 'decline', 'apply'].includes(action)) {
    return sendError(res, 400, 'action must be acknowledge | decline | apply');
  }
  const body = (req.body || {}) as any;
  const link = updateCrossLinkStatus(
    id,
    action as any,
    auth.user.id,
    body.decline_reason,
    body.applied_in_release,
  );
  if (!link) return sendError(res, 404, 'Cross-exam link not found');
  sendJSON(res, { link });
}

async function handleIncomingCrossLinks(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const links = listCrossLinksIncomingFor(req.params.exam_id);
  sendJSON(res, { links });
}

// ============================================================================
// Student — submit feedback against this sample version
// ============================================================================

async function handleSampleFeedbackSubmit(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const sample_id = req.params.id;
  const sample = getSampleCheck(sample_id);
  if (!sample) return sendError(res, 404, 'Sample check not found');

  // Corner case: submissions against a closed sample are rejected
  // (students following old links get bounced with a pointer to newer)
  if (sample.status === 'closed_resolved') {
    return sendError(res, 410, `This sample iteration is already resolved. No further feedback accepted.`);
  }
  if (sample.status === 'closed_superseded') {
    return sendError(res, 410, 
      `This sample iteration is superseded. Newer iteration: ${sample.superseded_by_sample_id}`,
    );
  }

  const body = (req.body || {}) as any;
  if (!body.kind || !body.description) {
    return sendError(res, 400, 'kind and description required');
  }

  try {
    const item = submitFeedback({
      kind: body.kind,
      target: {
        exam_id: sample.exam_id,
        sample_check_id: sample.id,         // Version-pinning
        mock_id: body.target?.mock_id,
        question_id: body.target?.question_id,
        lesson_id: body.target?.lesson_id,
        component_id: body.target?.component_id,
        topic_id: body.target?.topic_id,
        strategy_title: body.target?.strategy_title,
      },
      description: body.description,
      suggestion: body.suggestion,
      evidence: body.evidence,
      submitted_by: {
        user_id: auth.user.id,
        display_name: body.display_name,
        anonymous: Boolean(body.anonymous),
      },
    });
    updateStatsInStore(sample);
    sendJSON(res, {
      item,
      thanks:
        `Thanks for the feedback on iteration ${sample.iteration}. ` +
        `You'll see status updates at /api/feedback/mine as your input moves through triage.`,
    });
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
}

// ============================================================================
// Public — /s/:token
// ============================================================================

async function handlePublicShare(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const token = req.params.token;
  const sample = getSampleByToken(token);
  if (!sample) return sendError(res, 404, 'Sample check not found for this link');
  const loaded = loadExamContentAndName(sample.exam_id);
  const exam_name = loaded?.name ?? 'Unknown exam';
  const view = buildPublicView(sample, exam_name);
  sendJSON(res, view);
}

// ============================================================================

export const sampleCheckRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  // Admin: lifecycle
  { method: 'POST', path: '/api/admin/sample-check',                      handler: handleCreate },
  { method: 'GET',  path: '/api/admin/sample-check/list',                 handler: handleAdminList },
  { method: 'GET',  path: '/api/admin/sample-check/:id',                  handler: handleGetSample },
  { method: 'GET',  path: '/api/admin/sample-check/exam/:exam_id',        handler: handleExamSamples },
  { method: 'POST', path: '/api/admin/sample-check/:id/close-resolved',   handler: handleCloseResolved },
  { method: 'POST', path: '/api/admin/sample-check/:id/supersede',        handler: handleSupersede },
  { method: 'POST', path: '/api/admin/sample-check/carry-forward',        handler: handleCarryForward },

  // Admin: cross-exam
  { method: 'POST', path: '/api/admin/sample-check/cross-exam-link',      handler: handleCreateCrossLink },
  { method: 'POST', path: '/api/admin/sample-check/suggest-cross-links',  handler: handleSuggestCrossLinks },
  { method: 'POST', path: '/api/admin/cross-exam-link/:id/:action',       handler: handleCrossLinkAction },
  { method: 'GET',  path: '/api/admin/cross-exam-link/incoming/:exam_id', handler: handleIncomingCrossLinks },

  // Student
  { method: 'POST', path: '/api/sample-check/:id/feedback',               handler: handleSampleFeedbackSubmit },

  // Public
  { method: 'GET',  path: '/s/:token',                                    handler: handlePublicShare },
];
