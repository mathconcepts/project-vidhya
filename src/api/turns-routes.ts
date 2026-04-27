// @ts-nocheck
/**
 * src/api/turns-routes.ts
 *
 * Read API for the teaching-turn log. Three endpoints:
 *
 *   GET /api/turns/me               — student's own turns + summary
 *   GET /api/turns/student/:id      — admin/teacher: any student's turns
 *   GET /api/turns                  — admin: every turn (latest first)
 *
 * Auth model:
 *
 *   - /api/turns/me requires authentication, returns the caller's
 *     own turns regardless of role (a parent calling /me sees their
 *     own turns, not their children's — children's go through
 *     /student/:id with the parent's hasGuardianOf check).
 *   - /api/turns/student/:id requires either:
 *       (a) admin/owner role (full access), OR
 *       (b) teacher role AND target is in their roster, OR
 *       (c) parent role AND target is in their guardian_of, OR
 *       (d) the caller is the student themselves (same as /me).
 *   - /api/turns (full firehose) requires admin or higher.
 *
 * Privacy: response_text fields in attempt_outcome are truncated
 * to 200 chars at write time (see turn-store) — they're not raw.
 * Per-student endpoints scope further. The admin firehose is for
 * ops debugging, not for browsing student data; admins who need
 * student data should use /student/:id with the explicit ID.
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireAuth, requireRole } from '../auth/middleware';
import {
  listTurnsForStudent,
  listAllTurns,
  summariseStudent,
  type TeachingTurn,
} from '../modules/teaching';
import { getUserById, hasGuardianOf } from '../auth/user-store';

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Decide whether the caller can read turns for the given target student.
 * Returns null if allowed; an HTTP-status + reason if not.
 */
function authorize_student_read(
  actor: { id: string; role: string; guardian_of?: string[]; teacher_of?: string[] },
  target_id: string,
): { status: number; reason: string } | null {
  // Self-read always allowed.
  if (actor.id === target_id) return null;

  // Admin/owner/institution always allowed.
  if (['admin', 'owner', 'institution'].includes(actor.role)) return null;

  // Teacher reads — only if the target is in their roster.
  if (actor.role === 'teacher') {
    if ((actor.teacher_of ?? []).includes(target_id)) return null;
    return { status: 403, reason: 'student is not in your roster' };
  }

  // Parent reads — only if hasGuardianOf passes.
  if (actor.role === 'parent') {
    if ((actor.guardian_of ?? []).includes(target_id)) return null;
    return { status: 403, reason: 'you are not a guardian of this student' };
  }

  // Student-to-student: never allowed.
  return { status: 403, reason: 'cannot view another student\'s turns' };
}

// ─── Handlers ────────────────────────────────────────────────────────

async function h_my_turns(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const limit = Number((req.query as any)?.limit) || 50;
  const turns = listTurnsForStudent(auth.user.id, limit);
  const summary = summariseStudent(auth.user.id, limit);

  sendJSON(res, {
    student_id: auth.user.id,
    summary: {
      total_turns: summary.total_turns,
      closed_turns: summary.closed_turns,
      total_attempts: summary.total_attempts,
      correct_attempts: summary.correct_attempts,
      avg_mastery_delta_pct: summary.avg_mastery_delta_pct,
      trend: summary.trend,
    },
    turns,
  });
}

async function h_student_turns(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const target_id = (req.params as any)?.id;
  if (!target_id || typeof target_id !== 'string') {
    return sendError(res, 400, 'student id required');
  }

  const target = getUserById(target_id);
  if (!target) return sendError(res, 404, 'student not found');

  // Pull guardian_of / teacher_of off the actor's User record
  // (auth.user only carries id+role; we need the rest).
  const actor_record = getUserById(auth.user.id);
  if (!actor_record) return sendError(res, 401, 'actor not found');

  const denial = authorize_student_read({
    id: actor_record.id,
    role: actor_record.role,
    guardian_of: actor_record.guardian_of,
    teacher_of: actor_record.teacher_of,
  }, target_id);
  if (denial) return sendError(res, denial.status, denial.reason);

  const limit = Number((req.query as any)?.limit) || 50;
  const turns = listTurnsForStudent(target_id, limit);
  const summary = summariseStudent(target_id, limit);

  sendJSON(res, {
    student_id: target_id,
    student_name: target.name,
    summary: {
      total_turns: summary.total_turns,
      closed_turns: summary.closed_turns,
      total_attempts: summary.total_attempts,
      correct_attempts: summary.correct_attempts,
      avg_mastery_delta_pct: summary.avg_mastery_delta_pct,
      trend: summary.trend,
    },
    turns,
  });
}

async function h_all_turns(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;

  const limit = Number((req.query as any)?.limit) || 100;
  const turns = listAllTurns(limit);
  sendJSON(res, { count: turns.length, turns });
}

// ─── Route table ─────────────────────────────────────────────────────

export const turnsRoutes: Array<{
  method: string;
  path: string;
  handler: RouteHandler;
}> = [
  { method: 'GET', path: '/api/turns/me',           handler: h_my_turns },
  { method: 'GET', path: '/api/turns/student/:id',  handler: h_student_turns },
  { method: 'GET', path: '/api/turns',              handler: h_all_turns },
];
