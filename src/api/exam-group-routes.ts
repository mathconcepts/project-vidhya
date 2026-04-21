// @ts-nocheck
/**
 * Exam Group Routes — admin-facing master list management + student giveaway lookup
 *
 * Admin endpoints (require admin role):
 *   POST   /api/exam-groups                  Create draft group
 *   GET    /api/exam-groups                  List all groups
 *   GET    /api/exam-groups/:id              Full group with resolved members
 *   PATCH  /api/exam-groups/:id              Update metadata / member list
 *   POST   /api/exam-groups/:id/approve      Flip is_approved to true
 *   POST   /api/exam-groups/:id/unapprove    Flip is_approved to false
 *   POST   /api/exam-groups/:id/members      Add exam to group
 *   DELETE /api/exam-groups/:id/members/:eid Remove exam from group
 *   POST   /api/exam-groups/:id/archive      Archive (reversible)
 *   DELETE /api/exam-groups/:id              Permanent delete (owner only)
 *
 * Teacher+ read endpoints:
 *   GET /api/exam-groups/approved            List approved active groups
 *
 * Student endpoints (any signed-in user):
 *   GET /api/my-giveaway                     Is the current user part of
 *                                            an approved group? Returns
 *                                            bonus exams if so.
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireRole, requireAuth } from '../auth/middleware';
import { getUserById } from '../auth/user-store';
import {
  createGroup,
  getGroup,
  listGroups,
  updateGroup,
  deleteGroup,
  approveGroup,
  unapproveGroup,
  archiveGroup,
  addExamToGroup,
  removeExamFromGroup,
  resolveGroupMembers,
  resolveGiveaway,
  findGroupsContaining,
} from '../exams/exam-group-store';

// ============================================================================
// Admin handlers
// ============================================================================

async function handleCreateGroup(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body as any) || {};
  if (!body.code || !body.name) return sendError(res, 400, 'code and name required');
  if (!/^[A-Za-z0-9._-]{2,40}$/.test(body.code)) {
    return sendError(res, 400, 'code must be 2-40 chars, alphanumeric plus dot/underscore/dash');
  }

  const group = createGroup({
    code: body.code,
    name: body.name,
    description: body.description,
    exam_ids: Array.isArray(body.exam_ids) ? body.exam_ids : [],
    static_exam_ids: Array.isArray(body.static_exam_ids) ? body.static_exam_ids : [],
    tagline: body.tagline,
    benefits: Array.isArray(body.benefits) ? body.benefits : [],
  }, auth.user.id);

  sendJSON(res, { group }, 201);
}

async function handleListGroups(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const include_archived = req.query.get('include_archived') === 'true';
  const only_approved = req.query.get('only_approved') === 'true';
  const groups = listGroups({ include_archived, only_approved });
  sendJSON(res, {
    groups: groups.map(g => ({
      id: g.id,
      code: g.code,
      name: g.name,
      description: g.description,
      tagline: g.tagline,
      member_count: g.exam_ids.length + (g.static_exam_ids || []).length,
      is_approved: g.is_approved,
      is_archived: g.is_archived,
      approved_at: g.approved_at,
      created_at: g.created_at,
      updated_at: g.updated_at,
    })),
  });
}

async function handleListApproved(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'teacher');
  if (!auth) return;
  const groups = listGroups({ only_approved: true });
  sendJSON(res, {
    groups: groups.map(g => ({
      id: g.id,
      code: g.code,
      name: g.name,
      description: g.description,
      tagline: g.tagline,
      benefits: g.benefits,
      exam_ids: g.exam_ids,
      static_exam_ids: g.static_exam_ids,
    })),
  });
}

async function handleGetGroup(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const group = getGroup(req.params.id);
  if (!group) return sendError(res, 404, 'group not found');
  const { dynamicMembers, staticMembers } = resolveGroupMembers(group);
  sendJSON(res, {
    group,
    members: {
      dynamic: dynamicMembers.map((e: any) => ({
        id: e.id, code: e.code, name: e.name,
        completeness: e.completeness,
        is_draft: e.is_draft,
      })),
      static: staticMembers.map((e: any) => ({
        id: e.id, name: e.name, authority: e.authority,
        topics_count: e.topics?.length || 0,
      })),
    },
  });
}

async function handlePatchGroup(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body as any) || {};
  // Disallow flipping is_approved via PATCH — must use the approve endpoint
  const { is_approved, approved_by, approved_at, id, created_at, created_by, ...safe } = body;
  const updated = updateGroup({ id: req.params.id, updates: safe });
  if (!updated) return sendError(res, 404, 'group not found');
  sendJSON(res, { group: updated });
}

async function handleApprove(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const group = getGroup(req.params.id);
  if (!group) return sendError(res, 404, 'group not found');

  // Guard: require ≥2 member exams to approve
  const memberCount = group.exam_ids.length + (group.static_exam_ids || []).length;
  if (memberCount < 2) {
    return sendError(res, 400, 'group must contain at least 2 exams before approval');
  }

  const updated = approveGroup(req.params.id, auth.user.id);
  sendJSON(res, { group: updated });
}

async function handleUnapprove(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const updated = unapproveGroup(req.params.id);
  if (!updated) return sendError(res, 404, 'group not found');
  sendJSON(res, { group: updated });
}

async function handleAddMember(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body as any) || {};
  if (!body.exam_id) return sendError(res, 400, 'exam_id required');
  const is_static = body.is_static === true;
  const updated = addExamToGroup(req.params.id, body.exam_id, is_static);
  if (!updated) return sendError(res, 404, 'group not found');
  sendJSON(res, { group: updated });
}

async function handleRemoveMember(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const updated = removeExamFromGroup(req.params.id, req.params.eid);
  if (!updated) return sendError(res, 404, 'group not found');
  sendJSON(res, { group: updated });
}

async function handleArchiveGroup(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const body = (req.body as any) || {};
  const archived = body.archived !== false;
  const updated = archiveGroup(req.params.id, archived);
  if (!updated) return sendError(res, 404, 'group not found');
  sendJSON(res, { group: updated });
}

async function handleDeleteGroup(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'owner');
  if (!auth) return;
  const ok = deleteGroup(req.params.id);
  sendJSON(res, { deleted: ok });
}

// ============================================================================
// Student-facing handler
// ============================================================================

async function handleMyGiveaway(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const user = getUserById(auth.user.id);
  if (!user || !user.exam_id) {
    return sendJSON(res, { giveaway: null, reason: 'no exam assigned' });
  }
  const giveaway = resolveGiveaway(user.exam_id);
  sendJSON(res, { giveaway });
}

/**
 * Admin helper: find all groups that contain a given exam.
 * Used by ExamSetupPage to show "Part of group X, Y" badges.
 */
async function handleGroupsContainingExam(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  const exam_id = req.params.exam_id;
  const groups = findGroupsContaining(exam_id);
  sendJSON(res, {
    groups: groups.map(g => ({
      id: g.id,
      code: g.code,
      name: g.name,
      is_approved: g.is_approved,
    })),
  });
}

// ============================================================================

export const examGroupRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'POST',   path: '/api/exam-groups',                        handler: handleCreateGroup },
  { method: 'GET',    path: '/api/exam-groups',                        handler: handleListGroups },
  { method: 'GET',    path: '/api/exam-groups/approved',               handler: handleListApproved },
  { method: 'GET',    path: '/api/exam-groups/containing/:exam_id',    handler: handleGroupsContainingExam },
  { method: 'GET',    path: '/api/exam-groups/:id',                    handler: handleGetGroup },
  { method: 'PATCH',  path: '/api/exam-groups/:id',                    handler: handlePatchGroup },
  { method: 'POST',   path: '/api/exam-groups/:id/approve',            handler: handleApprove },
  { method: 'POST',   path: '/api/exam-groups/:id/unapprove',          handler: handleUnapprove },
  { method: 'POST',   path: '/api/exam-groups/:id/members',            handler: handleAddMember },
  { method: 'DELETE', path: '/api/exam-groups/:id/members/:eid',       handler: handleRemoveMember },
  { method: 'POST',   path: '/api/exam-groups/:id/archive',            handler: handleArchiveGroup },
  { method: 'DELETE', path: '/api/exam-groups/:id',                    handler: handleDeleteGroup },
  { method: 'GET',    path: '/api/my-giveaway',                        handler: handleMyGiveaway },
];
