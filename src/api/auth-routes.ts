// @ts-nocheck
/**
 * Auth Routes
 *
 * Endpoints:
 *   GET  /api/auth/config          — public config (client_id, enabled channels)
 *   POST /api/auth/google-callback — exchange Google ID token for Vidhya JWT
 *   GET  /api/auth/me              — current user info
 *   POST /api/auth/sign-out        — client discards token; server idempotent
 *   POST /api/auth/link-channel    — bind a pending telegram/whatsapp link token
 *   GET  /api/auth/link-status     — check pending link token status
 */

import { ServerResponse } from 'http';
import crypto from 'crypto';
import { verifyGoogleIdToken } from '../auth/google-verify';
import { issueToken } from '../auth/jwt';
import { upsertFromGoogle, linkChannel, getUserById } from '../auth/user-store';
import { getCurrentUser, requireAuth } from '../auth/middleware';
import type { ChannelLinkToken } from '../auth/types';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';

// ============================================================================
// Pending channel link tokens (in-memory, 15-min TTL)
// ============================================================================

const pendingLinkTokens = new Map<string, ChannelLinkToken>();
const LINK_TTL_MS = 15 * 60 * 1000;

function cleanupExpired() {
  const cutoff = Date.now() - LINK_TTL_MS;
  for (const [token, rec] of pendingLinkTokens) {
    if (rec.issued_at < cutoff) pendingLinkTokens.delete(token);
  }
}

export function createChannelLinkToken(channel: 'telegram' | 'whatsapp', channel_id: string): string {
  cleanupExpired();
  const token = crypto.randomBytes(12).toString('base64url');
  pendingLinkTokens.set(token, { token, channel, channel_id, issued_at: Date.now() });
  return token;
}

export function consumeChannelLinkToken(token: string): ChannelLinkToken | null {
  cleanupExpired();
  const rec = pendingLinkTokens.get(token);
  return rec || null;
}

// ============================================================================
// Handlers
// ============================================================================

async function handleConfig(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  sendJSON(res, {
    google_client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || null,
    channels: {
      web: true,
      telegram: !!process.env.TELEGRAM_BOT_TOKEN,
      whatsapp: !!process.env.WHATSAPP_ACCESS_TOKEN,
    },
  });
}

async function handleGoogleCallback(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  const { id_token, link_token } = body;
  if (typeof id_token !== 'string' || id_token.length < 100) {
    return sendJSON(res, { error: 'id_token required' }, 400);
  }
  const audience = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!audience) return sendJSON(res, { error: 'GOOGLE_OAUTH_CLIENT_ID not configured on server' }, 500);

  const identity = await verifyGoogleIdToken(id_token, audience);
  if (!identity) return sendJSON(res, { error: 'Google token invalid' }, 401);

  const user = upsertFromGoogle({
    google_sub: identity.sub,
    email: identity.email,
    name: identity.name,
    picture: identity.picture,
  });

  // If the sign-in carries a pending channel link token, bind now
  if (link_token && typeof link_token === 'string') {
    const pending = consumeChannelLinkToken(link_token);
    if (pending) {
      linkChannel({
        user_id: user.id,
        channel: pending.channel,
        channel_specific_id: pending.channel_id,
      });
      pendingLinkTokens.delete(link_token);
    }
  }

  const jwt = issueToken({ user_id: user.id, role: user.role });
  sendJSON(res, {
    token: jwt,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
    },
  });
}

async function handleMe(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await getCurrentUser(req);
  if (!auth) return sendJSON(res, { user: null }, 200);
  const { user } = auth;
  sendJSON(res, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
      teacher_of: user.teacher_of,
      taught_by: user.taught_by,
      channels: user.channels,
      created_at: user.created_at,
    },
  });
}

async function handleSignOut(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  // Stateless JWTs — client just discards. Server acknowledges.
  sendJSON(res, { ok: true });
}

async function handleLinkStatus(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const token = req.query.get('token');
  if (!token) return sendJSON(res, { error: 'token required' }, 400);
  const rec = consumeChannelLinkToken(token);
  if (!rec) return sendJSON(res, { exists: false }, 200);
  sendJSON(res, { exists: true, channel: rec.channel, has_user: !!rec.user_id });
}

// ============================================================================
// Export
// ============================================================================

export const authRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET',  path: '/api/auth/config',          handler: handleConfig },
  { method: 'POST', path: '/api/auth/google-callback', handler: handleGoogleCallback },
  { method: 'GET',  path: '/api/auth/me',              handler: handleMe },
  { method: 'POST', path: '/api/auth/sign-out',        handler: handleSignOut },
  { method: 'GET',  path: '/api/auth/link-status',     handler: handleLinkStatus },
];
