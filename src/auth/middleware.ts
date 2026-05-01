// @ts-nocheck
/**
 * Auth Middleware
 *
 * Integrates the new User Store + JWT + Role hierarchy.
 * Keeps the existing ParsedRequest shape used throughout the codebase.
 */

import { ServerResponse } from 'http';
import { verifyToken } from './jwt';
import { getUserById, touchUser } from './user-store';
import { roleGte, type Role, type User } from './types';
import { sendJSON, type ParsedRequest } from '../lib/route-helpers';

export interface AuthResult {
  user: User;
  token_exp: number;
}

/**
 * Extract + verify the current user. Returns null on any failure.
 * Safe to call on every request; touches last_seen_at.
 */
export async function getCurrentUser(req: ParsedRequest): Promise<AuthResult | null> {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const claims = verifyToken(token);
  if (!claims) return null;
  const user = getUserById(claims.sub);
  if (!user) return null;
  // Lightweight touch, async — best-effort
  try { touchUser(user.id); } catch {}
  return { user, token_exp: claims.exp };
}

/**
 * Gate for role-restricted handlers. Returns null and sends a 401/403
 * response if the check fails; returns the AuthResult otherwise.
 */
export async function requireRole(
  req: ParsedRequest,
  res: ServerResponse,
  min_role: Role,
): Promise<AuthResult | null> {
  const auth = await getCurrentUser(req);
  if (!auth) {
    sendJSON(res, { error: 'authentication required' }, 401);
    return null;
  }
  if (!roleGte(auth.user.role, min_role)) {
    sendJSON(res, { error: 'insufficient permissions', required_role: min_role, current_role: auth.user.role }, 403);
    return null;
  }
  return auth;
}

/**
 * Require the user to have ANY of the listed roles (or a role ranked above any of them).
 * Use this when an endpoint should be accessible by multiple distinct roles, e.g.
 * ['teacher', 'admin'] — admin already passes requireRole('teacher') via roleGte,
 * but the explicit list makes the intent self-documenting.
 */
export async function requireAnyRole(
  req: ParsedRequest,
  res: ServerResponse,
  allowed_roles: Role[],
): Promise<AuthResult | null> {
  const auth = await getCurrentUser(req);
  if (!auth) {
    sendJSON(res, { error: 'authentication required' }, 401);
    return null;
  }
  const ok = allowed_roles.some(r => roleGte(auth.user.role, r));
  if (!ok) {
    sendJSON(res, {
      error: 'insufficient permissions',
      allowed_roles,
      current_role: auth.user.role,
    }, 403);
    return null;
  }
  return auth;
}

/** Same as requireRole but just requires *any* signed-in user */
export async function requireAuth(req: ParsedRequest, res: ServerResponse): Promise<AuthResult | null> {
  const auth = await getCurrentUser(req);
  if (!auth) {
    sendJSON(res, { error: 'authentication required' }, 401);
    return null;
  }
  return auth;
}
