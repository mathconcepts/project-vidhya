// @ts-nocheck
/**
 * Exam Routes — admin-facing exam management endpoints
 *
 * All write endpoints require 'admin' role or higher. Read endpoints
 * (listing exams assignable to students) are accessible to teachers too,
 * since they may need to look up their students' target exam.
 *
 * Endpoints:
 *   POST   /api/exams                     Create new exam from seed
 *   GET    /api/exams                     List all exams (admin)
 *   GET    /api/exams/assignable          List exams a student can be assigned to
 *   GET    /api/exams/:id                 Full exam + completeness breakdown
 *   PATCH  /api/exams/:id                 Update fields (admin_manual source)
 *   POST   /api/exams/:id/enrich          Run LLM-backed enrichment
 *   POST   /api/exams/:id/enrich/apply    Apply a previously-previewed proposal
 *   POST   /api/exams/:id/local-data      Upload local context text
 *   DELETE /api/exams/:id/local-data/:ldid Remove a local-data entry
 *   POST   /api/exams/:id/mark-ready      Move from draft → ready
 *   POST   /api/exams/:id/archive         Archive (reversible)
 *   DELETE /api/exams/:id                 Permanently delete (admin only)
 *   POST   /api/exams/:id/assistant       Conversational assistant turn
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireRole, requireAuth } from '../auth/middleware';
import {
  createExam,
  getExam,
  listExams,
  updateExam,
  deleteExam,
  archiveExam,
  markReady,
  addLocalData,
  removeLocalData,
  getAssignableExams,
  getCompletenessBreakdown,
} from '../exams/exam-store';
import {
  enrichExam,
  mergeProposal,
  isEnrichmentAvailable,
  suggestNextFields,
} from '../exams/exam-enrichment';
import { getAssistantResponse } from '../exams/exam-assistant';
import {
  compareExams,
  toCanonical,
  staticToCanonical,
} from '../exams/exam-comparison';
import {
  findNearestMatches,
  findSimilarByIdentity,
} from '../exams/exam-similarity';
import { getExamContextForStudent } from '../gbrain/exam-context';
import { EXAMS as STATIC_EXAMS } from '../syllabus/exam-catalog';

// ============================================================================
// Create
// ============================================================================

async function handleCreate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;

  const body = (req.body as any) || {};
  if (!body.code || !body.name || !body.level) {
    return sendError(res, 400, 'code, name, and level are required');
  }
  if (!/^[A-Za-z0-9._-]{2,40}$/.test(body.code)) {
    return sendError(res, 400, 'code must be 2-40 chars, alphanumeric plus dot/underscore/dash');
  }

  const exam = createExam({
    code: body.code,
    name: body.name,
    level: body.level,
    country: body.country,
    issuing_body: body.issuing_body,
    description: body.description,
    official_url: body.official_url,
    seed_text: body.seed_text,
  }, auth.user.id);

  sendJSON(res, {
    exam,
    breakdown: getCompletenessBreakdown(exam),
    suggestions: suggestNextFields(exam),
    enrichment_available: isEnrichmentAvailable(),
  }, 201);
}

// ============================================================================
// List
// ============================================================================

async function handleList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;

  const include_archived = req.query.get('include_archived') === 'true';
  const include_drafts = req.query.get('include_drafts') !== 'false';
  const exams = listExams({ include_archived, include_drafts });
  sendJSON(res, {
    exams: exams.map(e => ({
      id: e.id,
      code: e.code,
      name: e.name,
      level: e.level,
      completeness: e.completeness,
      is_draft: e.is_draft,
      is_archived: e.is_archived,
      country: e.country,
      issuing_body: e.issuing_body,
      created_at: e.created_at,
      updated_at: e.updated_at,
    })),
    enrichment_available: isEnrichmentAvailable(),
  });
}

async function handleListAssignable(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'teacher');
  if (!auth) return;
  sendJSON(res, {
    exams: getAssignableExams().map(e => ({
      id: e.id,
      code: e.code,
      name: e.name,
      level: e.level,
      completeness: e.completeness,
    })),
  });
}

// ============================================================================
// Get by id
// ============================================================================

async function handleGet(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const id = req.params.id;
  const exam = getExam(id);
  if (!exam) return sendError(res, 404, 'exam not found');
  sendJSON(res, {
    exam,
    breakdown: getCompletenessBreakdown(exam),
    suggestions: suggestNextFields(exam),
    enrichment_available: isEnrichmentAvailable(),
  });
}

// ============================================================================
// Update
// ============================================================================

async function handlePatch(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const id = req.params.id;
  const body = (req.body as any) || {};

  const updated = updateExam({
    id,
    updates: body,
    source: 'admin_manual',
  });
  if (!updated) return sendError(res, 404, 'exam not found');
  sendJSON(res, { exam: updated });
}

// ============================================================================
// Enrich (preview)
// ============================================================================

async function handleEnrich(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const id = req.params.id;
  const exam = getExam(id);
  if (!exam) return sendError(res, 404, 'exam not found');

  try {
    const proposal = await enrichExam(exam);
    const merge = mergeProposal(exam, proposal);
    sendJSON(res, {
      proposal,
      merge_preview: {
        would_update_fields: Object.keys(merge.updates),
        would_skip_fields: merge.skipped_fields,
      },
    });
  } catch (err) {
    sendError(res, 500, `enrichment failed: ${(err as Error).message}`);
  }
}

async function handleEnrichApply(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const id = req.params.id;
  const exam = getExam(id);
  if (!exam) return sendError(res, 404, 'exam not found');
  const body = (req.body as any) || {};
  if (!body.proposal) return sendError(res, 400, 'proposal required in body');

  const merge = mergeProposal(exam, body.proposal);
  if (Object.keys(merge.updates).length === 0) {
    return sendJSON(res, {
      exam,
      applied: 0,
      skipped: merge.skipped_fields,
      note: 'No fields were applied — either all proposed fields were already manually set, or the proposal was empty.',
    });
  }

  const updated = updateExam({
    id,
    updates: merge.updates,
    source: 'web_research',
    confidence: body.proposal.confidence_overall,
    notes: body.proposal.notes,
  });

  sendJSON(res, {
    exam: updated,
    applied: Object.keys(merge.updates).length,
    skipped: merge.skipped_fields,
    applied_fields: Object.keys(merge.updates),
  });
}

// ============================================================================
// Local data
// ============================================================================

async function handleAddLocalData(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const id = req.params.id;
  const body = (req.body as any) || {};
  if (!body.content || !body.title) return sendError(res, 400, 'title and content required');
  const kind = body.kind === 'url' || body.kind === 'file_extract' ? body.kind : 'text';

  const entry = addLocalData({
    exam_id: id,
    kind,
    title: String(body.title).slice(0, 200),
    content: String(body.content).slice(0, 100_000),
    admin_user_id: auth.user.id,
  });
  if (!entry) return sendError(res, 404, 'exam not found');
  sendJSON(res, { entry }, 201);
}

async function handleRemoveLocalData(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const id = req.params.id;
  const ldid = req.params.ldid;
  const ok = removeLocalData(id, ldid);
  sendJSON(res, { ok });
}

// ============================================================================
// Lifecycle
// ============================================================================

async function handleMarkReady(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const updated = markReady(req.params.id);
  if (!updated) return sendError(res, 404, 'exam not found');
  sendJSON(res, { exam: updated });
}

async function handleArchive(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body as any) || {};
  const archived = body.archived !== false;
  const updated = archiveExam(req.params.id, archived);
  if (!updated) return sendError(res, 404, 'exam not found');
  sendJSON(res, { exam: updated });
}

async function handleDelete(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'owner');  // permanent delete is owner-only
  if (!auth) return;
  const ok = deleteExam(req.params.id);
  sendJSON(res, { deleted: ok });
}

// ============================================================================
// Assistant
// ============================================================================

async function handleAssistant(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const id = req.params.id;
  const exam = getExam(id);
  if (!exam) return sendError(res, 404, 'exam not found');

  const body = (req.body as any) || {};
  const mode = body.mode === 'reply' || body.mode === 'tip' || body.mode === 'open'
    ? body.mode
    : 'open';

  const response = getAssistantResponse({
    mode,
    exam,
    admin_message: body.message,
    history: body.history,
  });
  sendJSON(res, response);
}

// ============================================================================
// Similarity + comparison (v2.9.8)
// ============================================================================

/** GET /api/exams/:id/similar — nearest matches for an exam */
async function handleSimilar(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'teacher');
  if (!auth) return;
  const id = req.params.id;

  // Resolve from dynamic registry OR static catalog
  const dynamic = getExam(id);
  let canonical;
  if (dynamic) {
    canonical = toCanonical(dynamic);
  } else if ((STATIC_EXAMS as any)[id]) {
    canonical = staticToCanonical((STATIC_EXAMS as any)[id]);
  } else {
    return sendError(res, 404, 'exam not found');
  }

  const k = Math.min(parseInt(req.query.get('k') || '5') || 5, 20);
  const matches = findNearestMatches(canonical, k, { include_comparison: false });

  sendJSON(res, {
    target: { id: canonical.id, code: canonical.code, name: canonical.name, source: canonical.source },
    matches,
  });
}

/** GET /api/exams/compare?a=<id>&b=<id> — full pairwise comparison */
async function handleCompare(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'teacher');
  if (!auth) return;

  const idA = req.query.get('a');
  const idB = req.query.get('b');
  if (!idA || !idB) return sendError(res, 400, 'query params a and b required');

  const resolve = (id: string) => {
    const d = getExam(id);
    if (d) return toCanonical(d);
    const s = (STATIC_EXAMS as any)[id];
    if (s) return staticToCanonical(s);
    return null;
  };
  const a = resolve(idA);
  const b = resolve(idB);
  if (!a) return sendError(res, 404, `exam ${idA} not found`);
  if (!b) return sendError(res, 404, `exam ${idB} not found`);

  const comparison = compareExams(a, b);
  sendJSON(res, { comparison });
}

/**
 * POST /api/exams/suggest-similar — before creating, check for near-duplicates.
 * Takes a seed (name/level/country/issuing_body) and returns up to 3 existing
 * exams that could be reused or are close matches. Used by the create modal
 * to nudge "did you mean one of these?"
 */
async function handleSuggestSimilar(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body as any) || {};
  if (!body.name) return sendError(res, 400, 'name required');

  const matches = findSimilarByIdentity({
    name: body.name,
    level: body.level,
    country: body.country,
    issuing_body: body.issuing_body,
  }, 3);

  sendJSON(res, { matches });
}

/**
 * GET /api/exam-context/mine — returns the current user's exam context
 * if they have exam_id assigned. Any signed-in user can call this (students
 * read their own context; teachers reading their students' assignments use
 * the admin list endpoints instead).
 */
async function handleMyExamContext(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const ctx = await getExamContextForStudent(auth.user.id);
  sendJSON(res, { context: ctx });
}

// ============================================================================

export const examRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'POST',   path: '/api/exams',                             handler: handleCreate },
  { method: 'GET',    path: '/api/exams',                             handler: handleList },
  { method: 'GET',    path: '/api/exams/assignable',                  handler: handleListAssignable },
  { method: 'GET',    path: '/api/exams/compare',                     handler: handleCompare },
  { method: 'POST',   path: '/api/exams/suggest-similar',             handler: handleSuggestSimilar },
  { method: 'GET',    path: '/api/exam-context/mine',                 handler: handleMyExamContext },
  { method: 'GET',    path: '/api/exams/:id',                         handler: handleGet },
  { method: 'PATCH',  path: '/api/exams/:id',                         handler: handlePatch },
  { method: 'GET',    path: '/api/exams/:id/similar',                 handler: handleSimilar },
  { method: 'POST',   path: '/api/exams/:id/enrich',                  handler: handleEnrich },
  { method: 'POST',   path: '/api/exams/:id/enrich/apply',            handler: handleEnrichApply },
  { method: 'POST',   path: '/api/exams/:id/local-data',              handler: handleAddLocalData },
  { method: 'DELETE', path: '/api/exams/:id/local-data/:ldid',        handler: handleRemoveLocalData },
  { method: 'POST',   path: '/api/exams/:id/mark-ready',              handler: handleMarkReady },
  { method: 'POST',   path: '/api/exams/:id/archive',                 handler: handleArchive },
  { method: 'DELETE', path: '/api/exams/:id',                         handler: handleDelete },
  { method: 'POST',   path: '/api/exams/:id/assistant',               handler: handleAssistant },
];
