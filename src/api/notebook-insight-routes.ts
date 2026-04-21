// @ts-nocheck
/**
 * Notebook + Attempt-Insight Routes
 *
 * Endpoints for:
 *   1. Smart Notebook — log, cluster, gap-analyze, export
 *   2. After-each-attempt insight — the feedback hook for every interaction
 *
 * Notebook endpoints:
 *   POST /api/notebook/entry          — add a new entry
 *   GET  /api/notebook                — full notebook (JSON)
 *   GET  /api/notebook/clusters       — concept-clustered view
 *   GET  /api/notebook/gaps           — syllabus gap analysis
 *   GET  /api/notebook/download       — Markdown download
 *   POST /api/notebook/retag          — manual concept tag override
 *   DELETE /api/notebook/entry/:id    — delete an entry
 *
 * Attempt-insight endpoint:
 *   POST /api/gbrain/attempt-insight  — compute + return actionable feedback
 *                                       (reads model state before + after;
 *                                       does NOT record the attempt — that
 *                                       still goes through /api/gbrain/attempt)
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError, sendText, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireAuth, getCurrentUser } from '../auth/middleware';
import {
  addEntry,
  getNotebook,
  clusterByConcept,
  analyzeGaps,
  exportAsMarkdown,
  overrideConceptTag,
  deleteEntry,
  type NotebookEntryKind,
} from '../notebook/notebook-store';
import {
  computeInsight,
  type AttemptContext,
} from '../gbrain/after-each-attempt';
import { getOrCreateStudentModel } from '../gbrain/student-model';
import { getUserById } from '../auth/user-store';

// ============================================================================
// Helper: resolve the notebook subject — signed-in user, or anon session
// ============================================================================

async function resolveNotebookUserId(req: ParsedRequest): Promise<string | null> {
  const auth = await getCurrentUser(req);
  if (auth) return auth.user.id;
  // Anon fallback — session_id in query/body
  const q = req.query.get('session_id');
  if (q) return `anon_${q}`;
  const body = (req.body as any) || {};
  if (body.session_id) return `anon_${body.session_id}`;
  return null;
}

// ============================================================================
// Notebook handlers
// ============================================================================

async function handleAddEntry(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user_id = await resolveNotebookUserId(req);
  if (!user_id) return sendError(res, 401, 'authentication or session_id required');

  const body = (req.body as any) || {};
  const kind: NotebookEntryKind = body.kind;
  const valid: NotebookEntryKind[] = [
    'chat_question', 'snap', 'lesson_viewed', 'problem_attempted',
    'material_uploaded', 'diagnostic_taken', 'note',
  ];
  if (!valid.includes(kind)) return sendError(res, 400, 'invalid kind');

  const entry = addEntry({
    user_id,
    kind,
    text: typeof body.text === 'string' ? body.text : undefined,
    concept_id: body.concept_id || null,
    title: body.title,
    correct: body.correct,
    difficulty: body.difficulty,
    source_url: body.source_url,
  });

  sendJSON(res, { ok: true, entry });
}

async function handleGetNotebook(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user_id = await resolveNotebookUserId(req);
  if (!user_id) return sendError(res, 401, 'authentication or session_id required');
  sendJSON(res, getNotebook(user_id));
}

async function handleGetClusters(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user_id = await resolveNotebookUserId(req);
  if (!user_id) return sendError(res, 401, 'authentication or session_id required');
  const nb = getNotebook(user_id);
  sendJSON(res, clusterByConcept(nb));
}

async function handleGetGaps(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user_id = await resolveNotebookUserId(req);
  if (!user_id) return sendError(res, 401, 'authentication or session_id required');
  const nb = getNotebook(user_id);
  sendJSON(res, analyzeGaps(nb));
}

async function handleDownload(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user_id = await resolveNotebookUserId(req);
  if (!user_id) return sendError(res, 401, 'authentication or session_id required');

  let userName: string | undefined = undefined;
  if (!user_id.startsWith('anon_')) {
    const user = getUserById(user_id);
    userName = user?.name;
  }

  const md = exportAsMarkdown(user_id, userName);
  const filename = `vidhya-notebook-${new Date().toISOString().slice(0, 10)}.md`;
  res.writeHead(200, {
    'Content-Type': 'text/markdown; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Access-Control-Allow-Origin': '*',
  });
  res.end(md);
}

async function handleRetag(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user_id = await resolveNotebookUserId(req);
  if (!user_id) return sendError(res, 401, 'authentication or session_id required');
  const body = (req.body as any) || {};
  if (!body.entry_id || !body.concept_id) {
    return sendError(res, 400, 'entry_id and concept_id required');
  }
  const result = overrideConceptTag({
    user_id,
    entry_id: body.entry_id,
    concept_id: body.concept_id,
  });
  sendJSON(res, result);
}

async function handleDelete(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user_id = await resolveNotebookUserId(req);
  if (!user_id) return sendError(res, 401, 'authentication or session_id required');
  const entry_id = req.params.id;
  if (!entry_id) return sendError(res, 400, 'entry id required');
  deleteEntry(user_id, entry_id);
  sendJSON(res, { ok: true });
}

// ============================================================================
// After-each-attempt insight handler
// ============================================================================

async function handleAttemptInsight(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  const {
    session_id, concept_id, correct, difficulty, time_ms, error_type,
  } = body;

  if (!session_id || !concept_id || typeof correct !== 'boolean') {
    return sendError(res, 400, 'session_id, concept_id, correct required');
  }

  try {
    // We compute the insight WITHOUT writing — the actual attempt
    // recording is a separate call at /api/gbrain/attempt which persists
    // and then the insight endpoint reads the resulting model. But to
    // minimize round-trips, this endpoint accepts before/after context
    // OR reads from the current model (assuming the caller has already
    // called /api/gbrain/attempt first).

    const model_after = await getOrCreateStudentModel(session_id, null);
    const recentAttempts = (model_after as any)?.recent_attempts || [];

    // For the "before" model, we reconstruct it by subtracting this
    // attempt from the after state. Since this is the INSIGHT call
    // (not the RECORDING call), we approximate.
    const afterEntry = model_after?.mastery_vector?.[concept_id];
    const before_score = afterEntry && afterEntry.attempts > 0
      ? Math.max(0, afterEntry.score - (correct ? 0.06 : -0.02))
      : 0;
    const model_before = model_after ? {
      ...model_after,
      mastery_vector: {
        ...model_after.mastery_vector,
        [concept_id]: afterEntry ? {
          ...afterEntry,
          score: before_score,
          attempts: Math.max(0, afterEntry.attempts - 1),
        } : undefined,
      },
    } : null;

    const insight = computeInsight({
      concept_id,
      correct,
      difficulty,
      time_ms,
      error_type,
      model_before: model_before as any,
      model_after,
      recent_attempts: recentAttempts,
    });

    sendJSON(res, { insight });
  } catch (err) {
    console.error('[attempt-insight] error:', (err as Error).message);
    sendError(res, 500, 'insight computation failed');
  }
}

// ============================================================================

export const notebookRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'POST',   path: '/api/notebook/entry',          handler: handleAddEntry },
  { method: 'GET',    path: '/api/notebook',                handler: handleGetNotebook },
  { method: 'GET',    path: '/api/notebook/clusters',       handler: handleGetClusters },
  { method: 'GET',    path: '/api/notebook/gaps',           handler: handleGetGaps },
  { method: 'GET',    path: '/api/notebook/download',       handler: handleDownload },
  { method: 'POST',   path: '/api/notebook/retag',          handler: handleRetag },
  { method: 'DELETE', path: '/api/notebook/entry/:id',      handler: handleDelete },
  { method: 'POST',   path: '/api/gbrain/attempt-insight',  handler: handleAttemptInsight },
];
