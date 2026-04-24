// @ts-nocheck
/**
 * src/api/content-lifecycle-routes.ts
 *
 * Routes owned by the three new content-layer specialists:
 *   - content-router:       POST /api/student/content/request
 *   - upload-specialist:    POST/GET/DELETE /api/student/uploads
 *   - community-content-specialist:
 *                           GET  /api/student/content/subscriptions
 *                           POST /api/student/content/subscribe
 *                           POST /api/student/content/unsubscribe
 *                           POST /api/student/content/exclude-sources
 *                           GET  /api/student/content/bundles
 *                           GET  /api/admin/content/pin
 *
 * Named "-lifecycle-routes" to distinguish from the existing
 * content-routes.ts which owns the content-engine cascade endpoints
 * (/api/content/resolve, /verify, /stats, etc.).
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError } from '../lib/route-helpers';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireAuth, requireRole } from '../auth/middleware';
import { routeContent } from '../content/router';
import {
  createUpload, listUploads, getUpload, deleteUpload, readUploadBytes,
} from '../content/uploads';
import {
  getUserSubscriptions, subscribeToBundle, unsubscribeFromBundle,
  setExcludeSources, listCommunityBundles, readContentPin,
} from '../content/community';

// ─── content-router ───────────────────────────────────────────────────

async function h_contentRequest(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body ?? {}) as any;
  if (!body.text || typeof body.text !== 'string') {
    return sendError(res, 400, 'text required');
  }
  const result = await routeContent({
    user_id: auth.user.id,
    text: body.text,
    concept_id: body.concept_id,
    allow_generation: body.allow_generation === true,
    allow_wolfram:    body.allow_wolfram    === true,
  });
  sendJSON(res, result);
}

// ─── upload-specialist ────────────────────────────────────────────────

async function h_uploadCreate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body ?? {}) as any;
  if (!body.filename) return sendError(res, 400, 'filename required');
  if (!body.body && !body.body_base64) return sendError(res, 400, 'body or body_base64 required');

  let buf: Buffer | string;
  if (body.body_base64) {
    try {
      buf = Buffer.from(body.body_base64, 'base64');
    } catch {
      return sendError(res, 400, 'body_base64 decode failed');
    }
  } else {
    buf = body.body;
  }

  const result = createUpload({
    user_id: auth.user.id,
    filename: body.filename,
    body: buf,
    note: body.note,
    concept_tags: Array.isArray(body.concept_tags) ? body.concept_tags : undefined,
  });

  if (!result.ok) return sendError(res, 400, result.reason ?? 'upload failed');
  sendJSON(res, result.record, 201);
}

async function h_uploadList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const uploads = listUploads(auth.user.id);
  sendJSON(res, { uploads, count: uploads.length });
}

async function h_uploadGet(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const id = req.params?.id;
  if (!id) return sendError(res, 400, 'id required');
  const record = getUpload(auth.user.id, id);
  if (!record) return sendError(res, 404, 'upload not found');
  sendJSON(res, record);
}

async function h_uploadDelete(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const id = req.params?.id;
  if (!id) return sendError(res, 400, 'id required');
  const ok = deleteUpload(auth.user.id, id);
  if (!ok) return sendError(res, 404, 'upload not found');
  sendJSON(res, { ok: true, id });
}

// ─── community-content-specialist ─────────────────────────────────────

async function h_subsGet(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  sendJSON(res, getUserSubscriptions(auth.user.id));
}

async function h_subsAdd(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body ?? {}) as any;
  if (!body.bundle_id) return sendError(res, 400, 'bundle_id required');
  sendJSON(res, subscribeToBundle(auth.user.id, body.bundle_id));
}

async function h_subsRemove(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body ?? {}) as any;
  if (!body.bundle_id) return sendError(res, 400, 'bundle_id required');
  sendJSON(res, unsubscribeFromBundle(auth.user.id, body.bundle_id));
}

async function h_subsExclude(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const body = (req.body ?? {}) as any;
  if (!Array.isArray(body.sources)) return sendError(res, 400, 'sources[] required');
  sendJSON(res, setExcludeSources(auth.user.id, body.sources));
}

async function h_bundlesList(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  sendJSON(res, listCommunityBundles());
}

async function h_adminPin(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;
  sendJSON(res, readContentPin());
}

// ─── route table ──────────────────────────────────────────────────────

export const contentLifecycleRoutes: Array<{
  method: string;
  path: string;
  handler: RouteHandler;
}> = [
  // content-router
  { method: 'POST',   path: '/api/student/content/request',         handler: h_contentRequest },
  // uploads
  { method: 'POST',   path: '/api/student/uploads',                 handler: h_uploadCreate },
  { method: 'GET',    path: '/api/student/uploads',                 handler: h_uploadList },
  { method: 'GET',    path: '/api/student/uploads/:id',             handler: h_uploadGet },
  { method: 'DELETE', path: '/api/student/uploads/:id',             handler: h_uploadDelete },
  // subscriptions + bundles
  { method: 'GET',    path: '/api/student/content/subscriptions',   handler: h_subsGet },
  { method: 'POST',   path: '/api/student/content/subscribe',       handler: h_subsAdd },
  { method: 'POST',   path: '/api/student/content/unsubscribe',     handler: h_subsRemove },
  { method: 'POST',   path: '/api/student/content/exclude-sources', handler: h_subsExclude },
  { method: 'GET',    path: '/api/student/content/bundles',         handler: h_bundlesList },
  // admin
  { method: 'GET',    path: '/api/admin/content/pin',               handler: h_adminPin },
];
