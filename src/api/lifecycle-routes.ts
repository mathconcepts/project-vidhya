// @ts-nocheck
/**
 * src/api/lifecycle-routes.ts
 *
 * Routes owned by two customer-lifecycle specialists:
 *
 *   - conversion-specialist (under outreach-manager):
 *       POST /api/demo/convert        — trigger demo→paid migration
 *
 *   - data-rights-specialist (under security-manager):
 *       POST /api/me/delete           — request account deletion
 *       POST /api/me/delete/cancel    — cancel pending deletion
 *       POST /api/me/delete/confirm   — finalise after 24h cooling
 *       GET  /api/me/export           — portable JSON of user's data
 *
 * All routes require authentication via requireAuth except POST
 * /api/demo/convert, which takes a demo JWT in Authorization and
 * creates a real account in the same request.
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError } from '../lib/route-helpers';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireAuth } from '../auth/middleware';
import { upsertFromGoogle, getUserById } from '../auth/user-store';
import { migrateDemoToReal } from '../conversion/migrate-demo-to-real';
import {
  requestDeletion,
  cancelDeletion,
  confirmDeletion,
  exportUserData,
} from '../data-rights/delete';

// ─── POST /api/demo/convert ────────────────────────────────────────────

/**
 * Convert a demo session to a real account.
 *
 * The caller authenticates as a demo user (any student/owner/etc.
 * token from demo/demo-tokens.json). Request body provides the real
 * identity:
 *   {
 *     google_sub: "...",     // from Google OAuth — the real identity
 *     email: "...",
 *     name: "...",
 *     carry_over: true       // copy demo's plans/templates/trailing stats
 *   }
 *
 * For this first cut the demo user simulates having a google_sub.
 * In production this endpoint would be invoked after a client-side
 * Google sign-in, with the verified id_token passed here for
 * server-side verification (see src/auth/google-verify.ts).
 */
async function h_convertDemo(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const body = (req.body ?? {}) as any;
  const google_sub = body.google_sub;
  const email = body.email;
  const name = body.name ?? (auth.user.name + ' (real)');
  const carry_over = body.carry_over !== false;   // default true

  if (!google_sub || !email) {
    return sendError(res, 400, 'google_sub and email required');
  }

  // Create the real user via the same code path production Google
  // sign-in would use.
  const realUser = upsertFromGoogle({
    google_sub,
    email,
    name,
    picture: body.picture ?? '',
  });

  if (realUser.id === auth.user.id) {
    return sendError(res, 400,
      'google_sub already bound to this demo user — cannot self-convert');
  }

  const result = migrateDemoToReal({
    from_user_id: auth.user.id,
    to_user_id: realUser.id,
    carry_over,
  });

  if (!result.ok) {
    return sendError(res, 500, `migration failed: ${result.reason}`);
  }

  sendJSON(res, {
    ok: true,
    real_user: {
      id: realUser.id,
      email: realUser.email,
      name: realUser.name,
    },
    carried_over: result.carried_over,
    anonymised: result.anonymised,
    note:
      carry_over
        ? 'Your demo work is now on your real account. Sign in with Google to continue.'
        : 'Your real account was created. Your demo session stays where it was.',
  });
}

// ─── POST /api/me/delete ───────────────────────────────────────────────

async function h_deleteRequest(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const result = requestDeletion(auth.user.id);
  if (!result.ok) return sendError(res, 400, result.reason ?? 'deletion request failed');
  sendJSON(res, {
    ...result,
    message:
      'Deletion scheduled. You have 24 hours to cancel. To confirm before then, ' +
      'call POST /api/me/delete/confirm. To cancel, call POST /api/me/delete/cancel.',
  });
}

async function h_deleteCancel(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const r = cancelDeletion(auth.user.id);
  if (!r.ok) return sendError(res, 400, r.reason ?? 'cancel failed');
  sendJSON(res, { ok: true, message: 'Deletion cancelled. Your account is intact.' });
}

async function h_deleteConfirm(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const result = confirmDeletion(auth.user.id);
  if (!result.ok) return sendError(res, 400, result.reason ?? 'confirm failed');
  sendJSON(res, {
    ...result,
    message: 'Account deleted. All per-user data has been dropped.',
  });
}

// ─── GET /api/me/export ────────────────────────────────────────────────

async function h_export(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const data = exportUserData(auth.user.id);
  if (!data) return sendError(res, 404, 'user not found');
  sendJSON(res, data);
}

// ─── route table ──────────────────────────────────────────────────────

export const lifecycleRoutes: Array<{
  method: string;
  path: string;
  handler: RouteHandler;
}> = [
  { method: 'POST', path: '/api/demo/convert',        handler: h_convertDemo },
  { method: 'POST', path: '/api/me/delete',           handler: h_deleteRequest },
  { method: 'POST', path: '/api/me/delete/cancel',    handler: h_deleteCancel },
  { method: 'POST', path: '/api/me/delete/confirm',   handler: h_deleteConfirm },
  { method: 'GET',  path: '/api/me/export',           handler: h_export },
];
