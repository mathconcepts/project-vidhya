// @ts-nocheck
/**
 * Auth middleware for GATE Math API
 *
 * Verifies Supabase JWT tokens and checks user roles.
 * Falls back to anonymous session if no token is present.
 */

import { ServerResponse } from 'http';
import crypto from 'crypto';
import pg from 'pg';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';

const { Pool } = pg;

export interface UserInfo {
  userId: string;
  role: 'student' | 'teacher' | 'admin';
  email?: string;
}

let _pool: any = null;

function getPool() {
  if (_pool) return _pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('[auth] DATABASE_URL not configured');
  _pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000 });
  return _pool;
}

/**
 * Decode and verify a Supabase JWT (HS256)
 */
function verifyJWT(token: string): { sub: string; email?: string } | null {
  const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Verify signature
    const signatureInput = `${parts[0]}.${parts[1]}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(signatureInput)
      .digest('base64url');

    if (expectedSig !== parts[2]) return null;

    // Decode payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    // Check expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    return { sub: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

/**
 * Extract auth info from request. Returns null if no valid auth.
 *
 * Role-resolution order (first match wins):
 *   1. CRON_SECRET bearer        → role 'admin' (system)
 *   2. user_profiles row in DB   → that role (canonical for OAuth users)
 *   3. JWT 'role' claim          → demo/dev users seeded by demo/seed.ts
 *      (their user_profiles row doesn't exist because they never went
 *      through Supabase OAuth; the JWT minted by seed.ts carries the
 *      authoritative role for these accounts)
 *   4. 'student'                 → safe default
 */
export async function getAuth(req: ParsedRequest): Promise<UserInfo | null> {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;

  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;

  // Check if it's a CRON_SECRET (for automated jobs)
  if (token === process.env.CRON_SECRET) {
    return { userId: 'system', role: 'admin' };
  }

  const decoded = verifyJWT(token);
  if (!decoded) return null;

  // Try the canonical DB lookup first
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT role FROM user_profiles WHERE id = $1',
      [decoded.sub]
    );
    if (result.rows.length > 0 && result.rows[0]?.role) {
      return { userId: decoded.sub, role: result.rows[0].role, email: decoded.email };
    }
    // Row missing — fall back to JWT claim (demo/dev users)
    const claimRole = (decoded as any).role;
    if (claimRole === 'admin' || claimRole === 'teacher' || claimRole === 'student' || claimRole === 'owner') {
      return { userId: decoded.sub, role: claimRole === 'owner' ? 'admin' : claimRole, email: decoded.email };
    }
    return { userId: decoded.sub, role: 'student', email: decoded.email };
  } catch {
    // DB unreachable — still honour JWT claim if present
    const claimRole = (decoded as any).role;
    if (claimRole === 'admin' || claimRole === 'teacher' || claimRole === 'student' || claimRole === 'owner') {
      return { userId: decoded.sub, role: claimRole === 'owner' ? 'admin' : claimRole, email: decoded.email };
    }
    return { userId: decoded.sub, role: 'student', email: decoded.email };
  }
}

/**
 * Require authentication. Sends 401 and returns null if not authenticated.
 */
export async function requireAuth(req: ParsedRequest, res: ServerResponse): Promise<UserInfo | null> {
  const user = await getAuth(req);
  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Authentication required' }));
    return null;
  }
  return user;
}

/**
 * Require specific role(s). Sends 403 and returns null if insufficient permissions.
 */
export async function requireRole(
  req: ParsedRequest,
  res: ServerResponse,
  ...roles: string[]
): Promise<UserInfo | null> {
  const user = await requireAuth(req, res);
  if (!user) return null;

  if (!roles.includes(user.role)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Insufficient permissions' }));
    return null;
  }
  return user;
}

/**
 * Migrate anonymous session data to authenticated user.
 */
export async function migrateSession(userId: string, sessionId: string): Promise<void> {
  const pool = getPool();
  await pool.query('UPDATE sr_sessions SET user_id = $1 WHERE session_id = $2 AND user_id IS NULL', [userId, sessionId]);
  await pool.query('UPDATE streaks SET user_id = $1 WHERE identifier = $2 AND user_id IS NULL', [userId, sessionId]);
  await pool.query('UPDATE chat_messages SET user_id = $1 WHERE session_id = $2 AND user_id IS NULL', [userId, sessionId]);
  await pool.query('UPDATE user_profiles SET session_id = $2 WHERE id = $1', [userId, sessionId]);
  await pool.query('UPDATE notebook_entries SET user_id = $1 WHERE session_id = $2 AND user_id IS NULL', [userId, sessionId]);
  await pool.query('UPDATE study_profiles SET user_id = $1 WHERE session_id = $2 AND user_id IS NULL', [userId, sessionId]);
  await pool.query('UPDATE daily_plans SET user_id = $1 WHERE session_id = $2 AND user_id IS NULL', [userId, sessionId]);
}
