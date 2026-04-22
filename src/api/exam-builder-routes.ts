// @ts-nocheck
/**
 * Exam Builder — HTTP surface for the master orchestrator.
 *
 * Admin endpoints:
 *   POST /api/admin/exam-builder/build             Run orchestrated build
 *   GET  /api/admin/exam-builder/adapters          List registered exam adapters
 *   GET  /api/admin/exam-builder/feedback-preview  Preview feedback that WOULD be consulted
 *   GET  /api/admin/exam-builder/events/:build_id  Events for a specific build
 *   GET  /api/admin/exam-builder/events/exam/:exam_id
 *                                                  Recent events for an exam
 *   GET  /api/admin/exam-builder/events/recent     Recent events across all exams
 *   GET  /api/admin/exam-builder/summary/:build_id BuildSummary aggregation
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireRole } from '../auth/middleware';
import { buildOrUpdateCourse } from '../exam-builder/orchestrator';
import { listExamAdapters, getExamAdapter } from '../exam-builder/registry';
import { lookupFeedbackForBuild } from '../exam-builder/feedback-lookup';
import {
  listEventsForBuild, listEventsForExam, listRecentEvents, summarizeBuild,
} from '../exam-builder/event-log';

// ============================================================================

async function handleBuild(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body || {}) as any;
  if (!body.exam_id || !body.build_kind) {
    return sendError(res, 400, 'exam_id and build_kind ("new" | "iterate") required');
  }
  if (!['new', 'iterate'].includes(body.build_kind)) {
    return sendError(res, 400, 'build_kind must be "new" or "iterate"');
  }
  try {
    const trace = await buildOrUpdateCourse({
      exam_id: body.exam_id,
      build_kind: body.build_kind,
      options: body.options ?? {},
      actor: auth.user.id,
    });
    sendJSON(res, { trace });
  } catch (err: any) {
    sendError(res, 500, err.message ?? String(err));
  }
}

async function handleListAdapters(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const adapters = listExamAdapters().map(a => ({
    exam_id: a.exam_id,
    exam_code: a.exam_code,
    exam_name: a.exam_name,
    level: a.level,
    adapter_version: a.adapter_version,
    description: a.description,
    syllabus_topic_count: a.getSyllabusTopicIds().length,
    default_section_count: a.defaultGenerationSections().length,
    has_post_processor: Boolean(a.postProcessSnapshot),
  }));
  sendJSON(res, { adapters, count: adapters.length });
}

async function handleFeedbackPreview(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const exam_id = req.query.get('exam_id');
  if (!exam_id) return sendError(res, 400, 'exam_id query required');
  if (!getExamAdapter(exam_id)) return sendError(res, 404, `No adapter registered for ${exam_id}`);
  const report = await lookupFeedbackForBuild(exam_id);
  sendJSON(res, { report });
}

async function handleEventsBuild(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  sendJSON(res, { events: listEventsForBuild(req.params.build_id) });
}

async function handleEventsExam(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const limit = Number(req.query.get('limit') ?? 200);
  sendJSON(res, { events: listEventsForExam(req.params.exam_id, limit) });
}

async function handleEventsRecent(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const limit = Number(req.query.get('limit') ?? 100);
  sendJSON(res, { events: listRecentEvents(limit) });
}

async function handleBuildSummary(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const s = summarizeBuild(req.params.build_id);
  if (!s) return sendError(res, 404, 'Build not found');
  sendJSON(res, { summary: s });
}

// ============================================================================

export const examBuilderRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'POST', path: '/api/admin/exam-builder/build',                 handler: handleBuild },
  { method: 'GET',  path: '/api/admin/exam-builder/adapters',              handler: handleListAdapters },
  { method: 'GET',  path: '/api/admin/exam-builder/feedback-preview',      handler: handleFeedbackPreview },
  { method: 'GET',  path: '/api/admin/exam-builder/events/recent',         handler: handleEventsRecent },
  { method: 'GET',  path: '/api/admin/exam-builder/events/exam/:exam_id',  handler: handleEventsExam },
  { method: 'GET',  path: '/api/admin/exam-builder/events/:build_id',      handler: handleEventsBuild },
  { method: 'GET',  path: '/api/admin/exam-builder/summary/:build_id',     handler: handleBuildSummary },
];
