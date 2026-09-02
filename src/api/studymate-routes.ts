// @ts-nocheck
/**
 * Anytime Studymate — Session API Routes
 *
 * Endpoints:
 *   POST /api/studymate/sessions           — Build a new adaptive session
 *   GET  /api/studymate/sessions/resume    — Resume the current in-progress session
 *   POST /api/studymate/sessions/:id/answer  — Record an answer + trigger thinking-gap
 *   POST /api/studymate/sessions/:id/complete — Mark session complete, get stat line
 *
 * All endpoints are anonymous-first: session_id comes from the request body or
 * X-Session-Id header (the same anonymous localStorage key used throughout the app).
 * Optional auth: if the user is logged in, user_id is attached for teacher dashboard.
 *
 * /answer and /complete take a studymateId from the URL path — a value the
 * client fully controls — and REQUIRE session_id so isSessionOwner()
 * (session-engine.ts) can verify the caller's anonymous session actually
 * owns that studymateId before writing to it. /resume never needs this: it
 * only ever looks up sessions belonging to the caller's own session_id.
 */

import type { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { buildSession, resumeSession, recordAnswer, completeSession, isSessionOwner } from '../sessions/session-engine';
import { attachThinkingGap } from '../sessions/thinking-gap-service';
import { getAuth } from '../api/auth-middleware';

// ============================================================================
// Helpers
// ============================================================================

function extractSessionId(req: ParsedRequest): string | null {
  const fromBody = (req.body as any)?.session_id;
  if (typeof fromBody === 'string' && fromBody.trim()) return fromBody.trim();
  const fromHeader = req.headers?.['x-session-id'];
  if (typeof fromHeader === 'string' && fromHeader.trim()) return fromHeader.trim();
  return null;
}

// ============================================================================
// POST /api/studymate/sessions
// ============================================================================

async function h_build(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const sessionId = extractSessionId(req);
  if (!sessionId) return sendError(res, 400, 'session_id required (body or X-Session-Id header)');

  const body = (req.body ?? {}) as { exam_id?: string; session_type?: string };
  if (!body.exam_id || typeof body.exam_id !== 'string') {
    return sendError(res, 400, 'exam_id (string) is required');
  }

  const validTypes = ['daily', 'targeted', 'review'];
  const sessionType = validTypes.includes(body.session_type ?? '')
    ? (body.session_type as 'daily' | 'targeted' | 'review')
    : 'daily';

  try {
    const session = await buildSession(sessionId, body.exam_id, sessionType);
    return sendJSON(res, session, 201);
  } catch (err: any) {
    if (err?.message?.includes('No concepts found') || err?.message?.includes('No problems available')) {
      return sendError(res, 422, err.message);
    }
    console.error('[studymate-routes] buildSession error:', err);
    return sendError(res, 500, 'Failed to build session');
  }
}

// ============================================================================
// GET /api/studymate/sessions/resume
// ============================================================================

async function h_resume(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const sessionId = extractSessionId(req);
  if (!sessionId) return sendError(res, 400, 'session_id required (body or X-Session-Id header)');

  try {
    const session = await resumeSession(sessionId);
    if (!session) return sendJSON(res, { session: null }, 200);
    return sendJSON(res, session, 200);
  } catch (err) {
    console.error('[studymate-routes] resumeSession error:', err);
    return sendError(res, 500, 'Failed to resume session');
  }
}

// ============================================================================
// POST /api/studymate/sessions/:id/answer
// ============================================================================

async function h_answer(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const studymateId = req.params?.id;
  if (!studymateId) return sendError(res, 400, 'studymate session id required');

  // Anonymous session key — same header/body convention as the other
  // handlers. REQUIRED here (not merely for personalisation): studymateId
  // comes from a URL path segment the client fully controls, so without
  // proving which anonymous session actually owns it, any caller could
  // record an answer — or, since thinking-gap persistence started actually
  // writing on the flat-file backend, set gap_text — on someone else's
  // session (/ship review army, 2026-09-02).
  const sessionId = extractSessionId(req);
  if (!sessionId) return sendError(res, 400, 'session_id required (body or X-Session-Id header)');
  if (!(await isSessionOwner(studymateId, sessionId))) {
    return sendError(res, 403, 'session_id does not own this studymate session');
  }

  const body = (req.body ?? {}) as {
    problem_id?: string;
    user_answer?: string;
    was_correct?: boolean;
    question?: string;
    expected_answer?: string;
    concept_id?: string;
    top_misconceptions?: string[];
  };

  if (!body.problem_id) return sendError(res, 400, 'problem_id required');
  if (typeof body.user_answer !== 'string') return sendError(res, 400, 'user_answer (string) required');
  if (typeof body.was_correct !== 'boolean') return sendError(res, 400, 'was_correct (boolean) required');

  try {
    await recordAnswer(studymateId, body.problem_id, body.user_answer, body.was_correct);

    // Fire thinking-gap lazily for wrong answers — no await, don't block response
    if (!body.was_correct && body.concept_id && body.question && body.expected_answer) {
      attachThinkingGap(studymateId, body.problem_id, {
        concept_id: body.concept_id,
        question: body.question,
        expected_answer: body.expected_answer,
        user_answer: body.user_answer,
        top_misconceptions: body.top_misconceptions,
        // The framing (mastery band / stance / representation mode) that makes
        // this explanation read differently for a shaken beginner than for a
        // confident near-master is derived from the student model inside
        // attachThinkingGap, using this id. Deliberately not accepted from the
        // client: the frontend must not touch scorer fields, and a supplied
        // framing would just be a way to pick someone else's cache partition.
        session_id: sessionId,
      }).catch(err => console.error('[studymate-routes] attachThinkingGap error:', err));
    }

    return sendJSON(res, { ok: true });
  } catch (err) {
    console.error('[studymate-routes] recordAnswer error:', err);
    return sendError(res, 500, 'Failed to record answer');
  }
}

// ============================================================================
// POST /api/studymate/sessions/:id/complete
// ============================================================================

async function h_complete(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const studymateId = req.params?.id;
  if (!studymateId) return sendError(res, 400, 'studymate session id required');

  const sessionId = extractSessionId(req);
  if (!sessionId) return sendError(res, 400, 'session_id required (body or X-Session-Id header)');
  if (!(await isSessionOwner(studymateId, sessionId))) {
    return sendError(res, 403, 'session_id does not own this studymate session');
  }

  try {
    const stat = await completeSession(studymateId);
    return sendJSON(res, { stat });
  } catch (err) {
    console.error('[studymate-routes] completeSession error:', err);
    return sendError(res, 500, 'Failed to complete session');
  }
}

// ============================================================================
// Route table
// ============================================================================

export const studymateRoutes: Array<{
  method: string;
  path: string;
  handler: RouteHandler;
}> = [
  { method: 'POST', path: '/api/studymate/sessions',               handler: h_build },
  { method: 'GET',  path: '/api/studymate/sessions/resume',        handler: h_resume },
  { method: 'POST', path: '/api/studymate/sessions/:id/answer',    handler: h_answer },
  { method: 'POST', path: '/api/studymate/sessions/:id/complete',  handler: h_complete },
];
