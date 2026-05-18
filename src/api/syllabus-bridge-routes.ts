/**
 * Syllabus Bridge API
 *
 * Read endpoints (public):
 *   GET  /api/syllabus-bridge/curricula              — list source curricula
 *   GET  /api/syllabus-bridge/curricula/:id          — curriculum + topics
 *   GET  /api/syllabus-bridge/mappings               — list mappings
 *   GET  /api/syllabus-bridge/mappings/:id           — mapping with entries
 *   GET  /api/syllabus-bridge/mappings/:id/plan      — content plan + cost preview
 *
 * Write endpoints (admin only):
 *   POST /api/syllabus-bridge/batches                — submit a batch
 *   GET  /api/syllabus-bridge/batches                — list all batches
 *   GET  /api/syllabus-bridge/batches/:id            — batch status + results
 *
 * Read content:
 *   GET  /api/syllabus-bridge/content/by-mapping/:id — generated content for a mapping
 *   GET  /api/syllabus-bridge/content/:id            — single content unit
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import {
  listCurricula, getCurriculum,
  listMappings, getMapping,
} from '../syllabus-bridge/registry';
import { buildContentPlan, estimateCostUsd } from '../syllabus-bridge/content-plan';
import {
  saveBatch, getBatch, listBatches,
  listGeneratedContentForMapping, getGeneratedContent,
} from '../syllabus-bridge/store';
import { runBatch } from '../syllabus-bridge/batch-runner';
import {
  rankEntriesForStudent, cohortGapReport, recommendBridgeContent,
} from '../syllabus-bridge/gbrain-integration';
import {
  saveFeedback, computeSummary, mappingFeedbackOverview,
  listFeedbackForContent,
} from '../syllabus-bridge/feedback-store';
import { requireAuth, requireRole } from '../auth/middleware';
import type { BatchRequest, ContentFeedback, FeedbackRating } from '../syllabus-bridge/types';

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

// ----- Curricula -----

async function handleListCurricula(_req: ParsedRequest, res: ServerResponse) {
  const items = listCurricula().map(c => ({
    id: c.id,
    source_name: c.source_name,
    grade: c.grade,
    subject: c.subject,
    display_name: c.display_name,
    knowledge_track_id: c.knowledge_track_id,
    topic_count: c.topics.length,
    concept_count: c.topics.reduce((n, t) => n + t.concepts.length, 0),
    total_hours: c.topics.reduce((n, t) => n + t.estimated_hours, 0),
  }));
  sendJSON(res, { curricula: items });
}

async function handleGetCurriculum(req: ParsedRequest, res: ServerResponse) {
  const { id } = req.params;
  const c = getCurriculum(id);
  if (!c) return sendError(res, 404, `Curriculum '${id}' not found`);
  sendJSON(res, { curriculum: c });
}

// ----- Mappings -----

async function handleListMappings(_req: ParsedRequest, res: ServerResponse) {
  const items = listMappings().map(m => ({
    id: m.id,
    source_curriculum_id: m.source_curriculum_id,
    target_exam_id: m.target_exam_id,
    display_name: m.display_name,
    entry_count: m.entries.length,
    gap_breakdown: {
      aligned:     m.entries.filter(e => e.gap_class === 'aligned').length,
      depth_gap:   m.entries.filter(e => e.gap_class === 'depth-gap').length,
      breadth_gap: m.entries.filter(e => e.gap_class === 'breadth-gap').length,
      foundation:  m.entries.filter(e => e.gap_class === 'foundation').length,
    },
  }));
  sendJSON(res, { mappings: items });
}

async function handleGetMapping(req: ParsedRequest, res: ServerResponse) {
  const { id } = req.params;
  const m = getMapping(id);
  if (!m) return sendError(res, 404, `Mapping '${id}' not found`);
  sendJSON(res, { mapping: m });
}

async function handleGetMappingPlan(req: ParsedRequest, res: ServerResponse) {
  const { id } = req.params;
  const m = getMapping(id);
  if (!m) return sendError(res, 404, `Mapping '${id}' not found`);

  const plan = buildContentPlan(m);
  const cost = estimateCostUsd(plan);

  // Group units by entry for the admin UI
  const groupedByEntry: Record<string, any[]> = {};
  for (const u of plan.units) {
    (groupedByEntry[u.mapping_entry_id] ??= []).push(u);
  }

  sendJSON(res, {
    mapping_id: m.id,
    total_units: plan.units.length,
    total_estimated_tokens: plan.total_estimated_tokens,
    estimated_cost_usd: cost,
    grouped_by_entry: groupedByEntry,
  });
}

// ----- Batches (admin) -----

async function handleCreateBatch(req: ParsedRequest, res: ServerResponse) {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;

  const body = req.body as any;
  const mapping_id = body?.mapping_id;
  const requested_unit_ids: string[] | undefined = body?.unit_ids;
  const for_student_id: string | undefined = body?.for_student_id;
  const smart_priority: boolean = !!body?.smart_priority;
  const top_n: number = typeof body?.top_n === 'number' ? body.top_n : 10;

  if (!mapping_id || typeof mapping_id !== 'string') {
    return sendError(res, 400, 'mapping_id (string) required');
  }
  const m = getMapping(mapping_id);
  if (!m) return sendError(res, 404, `Mapping '${mapping_id}' not found`);

  const plan = buildContentPlan(m);
  let unitsToRun = plan.units;

  // Smart priority: when a target student is named, rank entries by need
  // (via GBrain) and keep only units belonging to the top-N entries.
  if (smart_priority && for_student_id) {
    const ranked = await rankEntriesForStudent(m, for_student_id);
    const topEntryIds = new Set(ranked.slice(0, top_n).map(r => r.entry.id));
    unitsToRun = plan.units.filter(u => topEntryIds.has(u.mapping_entry_id));
  } else if (requested_unit_ids?.length) {
    unitsToRun = plan.units.filter(u => requested_unit_ids.includes(u.unit_id));
  }

  if (unitsToRun.length === 0) {
    return sendError(res, 400, 'No units to run (either plan is empty, smart-priority returned nothing, or unit_ids did not match)');
  }

  const batch: BatchRequest = {
    batch_id: `BATCH-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    mapping_id,
    unit_ids: unitsToRun.map(u => u.unit_id),
    submitted_by: auth.user.id,
    for_student_id,
    submitted_at: new Date().toISOString(),
    status: 'queued',
    results: unitsToRun.map(u => ({ unit_id: u.unit_id, status: 'pending' as const })),
    total_units: unitsToRun.length,
    completed_units: 0,
    failed_units: 0,
    total_cost_estimate_usd: 0,
  };
  saveBatch(batch);

  // Fire-and-forget: run the batch in the background. We don't await it
  // so the HTTP call returns immediately and the UI can poll for progress.
  setImmediate(() => {
    runBatch(batch, plan.units).catch(err => {
      batch.status = 'failed';
      batch.error = err?.message ?? String(err);
      batch.completed_at = new Date().toISOString();
      saveBatch(batch);
    });
  });

  sendJSON(res, { batch }, 201);
}

/**
 * GET /api/syllabus-bridge/mappings/:id/recommendations
 *
 * For the authenticated student: return the top-N bridge entries they need
 * most right now, plus any already-generated content units the planner can
 * serve. Used by SmartPracticePage / PlannedSessionPage to weave bridge
 * content into the student's session.
 */
async function handleGetRecommendations(req: ParsedRequest, res: ServerResponse) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { id } = req.params;
  const limitStr = req.query?.get('limit');
  const limit = limitStr ? parseInt(limitStr, 10) : 5;
  const recs = await recommendBridgeContent(auth.user.id, id, { limit });
  sendJSON(res, { mapping_id: id, recommendations: recs });
}

/**
 * POST /api/syllabus-bridge/mappings/:id/cohort-report
 *
 * Body: { student_ids: string[] }  (typically a teacher's roster ids)
 * Admin or teacher only. Returns the top-15 entries by struggle volume
 * with recommended teacher action per entry.
 */
async function handleCohortReport(req: ParsedRequest, res: ServerResponse) {
  const auth = await requireRole(req, res, 'teacher');
  if (!auth) return;
  const { id } = req.params;
  const m = getMapping(id);
  if (!m) return sendError(res, 404, `Mapping '${id}' not found`);
  const body = req.body as any;
  const ids: string[] = Array.isArray(body?.student_ids) ? body.student_ids : [];
  if (ids.length === 0) return sendError(res, 400, 'student_ids (string[]) required');
  const stats = await cohortGapReport(ids, m);
  sendJSON(res, { mapping_id: id, cohort_size: ids.length, stats });
}

/**
 * GET /api/syllabus-bridge/mappings/:id/ranked-entries
 *
 * Admin-only diagnostic — returns the GBrain-ranked list for any student.
 * Used by the Syllabus Bridge admin page to power its "smart priority"
 * preview before submitting a batch.
 */
async function handleRankedEntries(req: ParsedRequest, res: ServerResponse) {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const { id } = req.params;
  const m = getMapping(id);
  if (!m) return sendError(res, 404, `Mapping '${id}' not found`);
  const studentId = req.query?.get('student_id');
  if (!studentId) return sendError(res, 400, 'student_id query param required');
  const ranked = await rankEntriesForStudent(m, studentId);
  // Strip the entry object in the response to a compact summary so the UI
  // doesn't get the editorial bridge_note twice (it already has the mapping).
  sendJSON(res, {
    mapping_id: id,
    student_id: studentId,
    ranked: ranked.map(r => ({
      entry_id: r.entry.id,
      gap_class: r.entry.gap_class,
      difficulty_jump: r.entry.difficulty_jump,
      target_topic_ids: r.entry.target_topic_ids,
      need_score: Number(r.need_score.toFixed(3)),
      target_mastery: r.target_mastery,
      reason: r.reason,
    })),
  });
}

async function handleListBatches(req: ParsedRequest, res: ServerResponse) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  sendJSON(res, { batches: listBatches() });
}

async function handleGetBatch(req: ParsedRequest, res: ServerResponse) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { id } = req.params;
  const b = getBatch(id);
  if (!b) return sendError(res, 404, `Batch '${id}' not found`);
  sendJSON(res, { batch: b });
}

// ----- Content -----

async function handleListContentForMapping(req: ParsedRequest, res: ServerResponse) {
  const { id } = req.params;
  const m = getMapping(id);
  if (!m) return sendError(res, 404, `Mapping '${id}' not found`);
  const items = listGeneratedContentForMapping(id);
  sendJSON(res, { mapping_id: id, content: items });
}

async function handleGetContent(req: ParsedRequest, res: ServerResponse) {
  const { id } = req.params;
  const c = getGeneratedContent(id);
  if (!c) return sendError(res, 404, `Content '${id}' not found`);
  sendJSON(res, { content: c });
}

// ---------------------------------------------------------------------------
// Feedback endpoints
// ---------------------------------------------------------------------------

const VALID_RATINGS = new Set<FeedbackRating>([
  'helpful', 'not-helpful', 'wrong', 'unclear', 'too-easy', 'too-hard',
]);

/**
 * POST /api/syllabus-bridge/content/:id/feedback
 *
 * Body: { rating: FeedbackRating, comment?: string }
 * Any authenticated user can leave feedback; admins use it to monitor
 * quality, students/teachers use it to flag problems.
 *
 * When 3+ 'wrong' or specific thresholds are hit, the underlying content
 * is auto-flagged for regeneration (see feedback-store.computeSummary).
 */
async function handlePostFeedback(req: ParsedRequest, res: ServerResponse) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { id } = req.params;
  const content = getGeneratedContent(id);
  if (!content) return sendError(res, 404, `Content '${id}' not found`);

  const body = req.body as any;
  const rating = body?.rating as FeedbackRating;
  if (!rating || !VALID_RATINGS.has(rating)) {
    return sendError(res, 400, `rating must be one of: ${[...VALID_RATINGS].join(', ')}`);
  }
  const comment: string | undefined =
    typeof body?.comment === 'string' && body.comment.trim()
      ? body.comment.trim().slice(0, 500)
      : undefined;

  const entry: ContentFeedback = {
    feedback_id: `FB-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    content_id: id,
    unit_id: content.unit_id,
    mapping_id: content.mapping_id,
    user_id: auth.user.id,
    role: (auth.user.role as 'student' | 'teacher' | 'admin') ?? 'student',
    rating,
    comment,
    created_at: new Date().toISOString(),
  };
  saveFeedback(entry);

  const summary = computeSummary(id);
  sendJSON(res, { feedback: entry, summary }, 201);
}

/** GET /api/syllabus-bridge/content/:id/feedback — list + summary for one piece */
async function handleGetContentFeedback(req: ParsedRequest, res: ServerResponse) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { id } = req.params;
  const content = getGeneratedContent(id);
  if (!content) return sendError(res, 404, `Content '${id}' not found`);
  sendJSON(res, {
    content_id: id,
    summary: computeSummary(id),
    entries: listFeedbackForContent(id),
  });
}

/** GET /api/syllabus-bridge/mappings/:id/feedback-overview — mapping-wide stats */
async function handleMappingFeedbackOverview(req: ParsedRequest, res: ServerResponse) {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { id } = req.params;
  const m = getMapping(id);
  if (!m) return sendError(res, 404, `Mapping '${id}' not found`);
  sendJSON(res, { mapping_id: id, ...mappingFeedbackOverview(id) });
}

/**
 * POST /api/syllabus-bridge/mappings/:id/regenerate-flagged
 *
 * Admin action. Finds every content unit in the mapping that has been
 * auto-flagged-for-regen by accumulated feedback, then submits a batch
 * to regenerate them. Cheap, focused, feedback-driven.
 */
async function handleRegenerateFlagged(req: ParsedRequest, res: ServerResponse) {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const { id } = req.params;
  const m = getMapping(id);
  if (!m) return sendError(res, 404, `Mapping '${id}' not found`);

  // Find flagged units in this mapping
  const allContent = (await import('../syllabus-bridge/store')).listGeneratedContentForMapping(id);
  const flaggedUnitIds = allContent.filter(c => c.flagged_for_regen).map(c => c.unit_id);
  if (flaggedUnitIds.length === 0) {
    return sendJSON(res, { regenerated: 0, message: 'No content currently flagged for regeneration' });
  }

  const plan = buildContentPlan(m);
  const unitsToRun = plan.units.filter(u => flaggedUnitIds.includes(u.unit_id));
  if (unitsToRun.length === 0) {
    return sendJSON(res, { regenerated: 0, message: 'Flagged content not found in current plan' });
  }

  const batch: BatchRequest = {
    batch_id: `BATCH-regen-${Date.now().toString(36)}`,
    mapping_id: id,
    unit_ids: unitsToRun.map(u => u.unit_id),
    submitted_by: auth.user.id,
    submitted_at: new Date().toISOString(),
    status: 'queued',
    results: unitsToRun.map(u => ({ unit_id: u.unit_id, status: 'pending' as const })),
    total_units: unitsToRun.length,
    completed_units: 0,
    failed_units: 0,
    total_cost_estimate_usd: 0,
  };
  saveBatch(batch);
  setImmediate(() => {
    runBatch(batch, plan.units).catch(err => {
      batch.status = 'failed';
      batch.error = err?.message ?? String(err);
      batch.completed_at = new Date().toISOString();
      saveBatch(batch);
    });
  });
  sendJSON(res, { regenerated: unitsToRun.length, batch }, 201);
}

export const syllabusBridgeRoutes: RouteDefinition[] = [
  { method: 'GET',  path: '/api/syllabus-bridge/curricula',                  handler: handleListCurricula },
  { method: 'GET',  path: '/api/syllabus-bridge/curricula/:id',              handler: handleGetCurriculum },
  { method: 'GET',  path: '/api/syllabus-bridge/mappings',                   handler: handleListMappings },
  { method: 'GET',  path: '/api/syllabus-bridge/mappings/:id',               handler: handleGetMapping },
  { method: 'GET',  path: '/api/syllabus-bridge/mappings/:id/plan',          handler: handleGetMappingPlan },
  { method: 'GET',  path: '/api/syllabus-bridge/mappings/:id/recommendations', handler: handleGetRecommendations },
  { method: 'POST', path: '/api/syllabus-bridge/mappings/:id/cohort-report', handler: handleCohortReport },
  { method: 'GET',  path: '/api/syllabus-bridge/mappings/:id/ranked-entries', handler: handleRankedEntries },
  { method: 'POST', path: '/api/syllabus-bridge/batches',                    handler: handleCreateBatch },
  { method: 'GET',  path: '/api/syllabus-bridge/batches',                    handler: handleListBatches },
  { method: 'GET',  path: '/api/syllabus-bridge/batches/:id',                handler: handleGetBatch },
  { method: 'GET',  path: '/api/syllabus-bridge/content/by-mapping/:id',     handler: handleListContentForMapping },
  { method: 'GET',  path: '/api/syllabus-bridge/content/:id',                handler: handleGetContent },
  { method: 'POST', path: '/api/syllabus-bridge/content/:id/feedback',       handler: handlePostFeedback },
  { method: 'GET',  path: '/api/syllabus-bridge/content/:id/feedback',       handler: handleGetContentFeedback },
  { method: 'GET',  path: '/api/syllabus-bridge/mappings/:id/feedback-overview', handler: handleMappingFeedbackOverview },
  { method: 'POST', path: '/api/syllabus-bridge/mappings/:id/regenerate-flagged', handler: handleRegenerateFlagged },
];
