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

interface ParsedRequest {
  pathname: string;
  query: URLSearchParams;
  params: Record<string, string>;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
}

export interface AuthResult {
  user: User;
  token_exp: number;
}

function sendJSON(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
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

/** Same as requireRole but just requires *any* signed-in user */
export async function requireAuth(req: ParsedRequest, res: ServerResponse): Promise<AuthResult | null> {
  const auth = await getCurrentUser(req);
  if (!auth) {
    sendJSON(res, { error: 'authentication required' }, 401);
    return null;
  }
  return auth;
}
