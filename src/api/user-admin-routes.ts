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
import type { Role } from '../auth/types';

interface ParsedRequest {
  pathname: string;
  query: URLSearchParams;
  params: Record<string, string>;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
}
type RouteHandler = (req: ParsedRequest, res: ServerResponse) => Promise<void>;

function sendJSON(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

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
  if (!['owner', 'admin', 'teacher', 'student'].includes(new_role)) {
    return sendJSON(res, { error: 'invalid role' }, 400);
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
// Export
// ============================================================================

export const userAdminRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET',  path: '/api/admin/users',              handler: handleListUsers },
  { method: 'GET',  path: '/api/admin/users/:id',          handler: handleGetUser },
  { method: 'POST', path: '/api/admin/users/:id/role',     handler: handleSetRole },
  { method: 'POST', path: '/api/admin/users/:id/teacher',  handler: handleAssignTeacher },
  { method: 'POST', path: '/api/admin/users/:id/unlink',   handler: handleUnlinkChannel },
  { method: 'POST', path: '/api/owner/transfer-ownership', handler: handleTransferOwnership },
];
