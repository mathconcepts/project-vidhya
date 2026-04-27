// @ts-nocheck
/**
 * User Admin Routes
 *
 * Endpoints (all require admin role or higher):
 *   GET  /api/admin/users                — list all users
 *   GET  /api/admin/users/:id            — single user detail
 *   POST /api/admin/users/:id/role       — change role (body: { new_role })
 *   POST /api/admin/users/:id/teacher    — assign teacher (body: { teacher_id })
 *   POST /api/admin/users/:id/unlink     — unlink a channel (body: { channel_key })
 *
 * Owner-only:
 *   POST /api/owner/transfer-ownership   — body: { new_owner_id }
 */

import { ServerResponse } from 'http';
import {
  listUsers,
  getUserById,
  setRole,
  assignTeacher,
  unlinkChannel,
  transferOwnership,
} from '../auth/user-store';
import { requireRole } from '../auth/middleware';
import {
  modelToTeacherRosterEntry,
  summarizeCohort,
} from '../gbrain/integration';
import { getOrCreateStudentModel } from '../gbrain/student-model';
import type { Role } from '../auth/types';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';

// Hide sensitive internals in list responses
function safeUser(u: any) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    picture: u.picture,
    role: u.role,
    teacher_of: u.teacher_of,
    taught_by: u.taught_by,
    channels: u.channels,
    created_at: u.created_at,
    last_seen_at: u.last_seen_at,
  };
}

// ============================================================================

async function handleListUsers(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const users = listUsers().map(safeUser);
  // Summary counts for the admin dashboard header
  const counts = {
    total: users.length,
    owner: users.filter(u => u.role === 'owner').length,
    admin: users.filter(u => u.role === 'admin').length,
    teacher: users.filter(u => u.role === 'teacher').length,
    student: users.filter(u => u.role === 'student').length,
  };
  sendJSON(res, { users, counts });
}

async function handleGetUser(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const user = getUserById(req.params.id);
  if (!user) return sendJSON(res, { error: 'user not found' }, 404);
  sendJSON(res, { user: safeUser(user) });
}

async function handleSetRole(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body as any) || {};
  const new_role: Role = body.new_role;
  // The full allowed set matches the Role union in src/auth/types.ts.
  // Flag-gated roles (parent, institution) are accepted at the route
  // layer; the user-store's setRole() rejects them with a clear reason
  // when their feature flag is off.
  const VALID_ROLES: Role[] = ['owner', 'admin', 'teacher', 'student', 'parent', 'institution'];
  if (!VALID_ROLES.includes(new_role)) {
    return sendJSON(res, { error: 'invalid role', expected: VALID_ROLES }, 400);
  }
  const result = setRole({
    actor_id: auth.user.id,
    target_id: req.params.id,
    new_role,
  });
  if (!result.ok) return sendJSON(res, { error: result.reason }, 403);
  sendJSON(res, { ok: true, user: safeUser(result.user) });
}

async function handleAssignTeacher(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body as any) || {};
  const teacher_id: string | null = body.teacher_id ?? null;
  const result = assignTeacher({
    actor_id: auth.user.id,
    student_id: req.params.id,
    teacher_id,
  });
  if (!result.ok) return sendJSON(res, { error: result.reason }, 400);
  sendJSON(res, { ok: true });
}

async function handleUnlinkChannel(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body as any) || {};
  const channel_key: string = body.channel_key;
  if (!channel_key) return sendJSON(res, { error: 'channel_key required' }, 400);
  unlinkChannel({ user_id: req.params.id, channel_key });
  sendJSON(res, { ok: true });
}

async function handleTransferOwnership(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'owner');
  if (!auth) return;
  const body = (req.body as any) || {};
  const { new_owner_id } = body;
  if (!new_owner_id) return sendJSON(res, { error: 'new_owner_id required' }, 400);
  const result = transferOwnership({ actor_id: auth.user.id, new_owner_id });
  if (!result.ok) return sendJSON(res, { error: result.reason }, 403);
  sendJSON(res, { ok: true });
}

// ============================================================================
// GBrain-powered endpoints (NEW in v2.9)
// ============================================================================

/**
 * Teacher roster — shows cognitive-model summaries for students assigned
 * to the requesting teacher. Admin can request any teacher's roster.
 */
async function handleTeacherRoster(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'teacher');
  if (!auth) return;

  // Target teacher: self (teacher role) or specified teacher_id (admin+)
  const target_teacher_id = req.params.teacher_id || auth.user.id;
  if (target_teacher_id !== auth.user.id && auth.user.role === 'teacher') {
    return sendJSON(res, { error: 'teachers can only see their own roster' }, 403);
  }
  const teacher = getUserById(target_teacher_id);
  if (!teacher) return sendJSON(res, { error: 'teacher not found' }, 404);
  if (teacher.role !== 'teacher' && teacher.role !== 'admin' && teacher.role !== 'owner') {
    return sendJSON(res, { error: 'target is not a teacher' }, 400);
  }

  // For each student assigned to this teacher, fetch their cognitive model
  // and compose a roster entry. Falls back to zero-mastery entries if
  // GBrain is unavailable.
  const entries: any[] = [];
  for (const student_id of teacher.teacher_of) {
    const student = getUserById(student_id);
    if (!student) continue;
    let entry;
    try {
      // Note: session_id is the GBrain key, but in the Roles v2.8 system
      // each signed-in user has their own student_id which we treat as
      // the session_id for model lookup
      const model = await getOrCreateStudentModel(student.id, student.id);
      entry = modelToTeacherRosterEntry(student.id, model);
    } catch {
      entry = modelToTeacherRosterEntry(student.id, null);
    }
    entries.push({
      ...entry,
      name: student.name,
      email: student.email,
      picture: student.picture,
    });
  }

  // Sort: students needing attention first, then by lowest mastery
  entries.sort((a, b) => {
    if (a.needs_attention !== b.needs_attention) return a.needs_attention ? -1 : 1;
    return a.overall_mastery - b.overall_mastery;
  });

  sendJSON(res, {
    teacher: { id: teacher.id, name: teacher.name, email: teacher.email },
    student_count: entries.length,
    attention_count: entries.filter(e => e.needs_attention).length,
    students: entries,
  });
}

/**
 * Cohort summary — admin-only aggregate view. Pulls all student models
 * and summarizes mastery, frustration rate, struggling concepts.
 */
async function handleCohortSummary(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;

  const students = listUsers().filter(u => u.role === 'student');
  const models: any[] = [];
  for (const s of students) {
    try {
      const m = await getOrCreateStudentModel(s.id, s.id);
      models.push(m);
    } catch {
      models.push(null);
    }
  }

  sendJSON(res, summarizeCohort(models));
}

// ============================================================================
// Export
// ============================================================================

export const userAdminRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET',  path: '/api/admin/users',              handler: handleListUsers },
  { method: 'GET',  path: '/api/admin/users/:id',          handler: handleGetUser },
  { method: 'POST', path: '/api/admin/users/:id/role',     handler: handleSetRole },
  { method: 'POST', path: '/api/admin/users/:id/teacher',  handler: handleAssignTeacher },
  { method: 'POST', path: '/api/admin/users/:id/unlink',   handler: handleUnlinkChannel },
  { method: 'POST', path: '/api/owner/transfer-ownership', handler: handleTransferOwnership },
  // GBrain-bridged endpoints
  { method: 'GET',  path: '/api/teacher/roster',               handler: handleTeacherRoster },
  { method: 'GET',  path: '/api/teacher/roster/:teacher_id',   handler: handleTeacherRoster },
  { method: 'GET',  path: '/api/admin/cohort-summary',         handler: handleCohortSummary },
];
