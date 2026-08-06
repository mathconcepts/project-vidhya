// @ts-nocheck
/**
 * Auth middleware for Project Vidhya
 *
 * Supports two authentication modes, selected by VIDHYA_AUTH_MODE:
 *
 *   'supabase' (default) — HS256 shared secret (JWT_SECRET / SUPABASE_JWT_SECRET).
 *     Existing behaviour, unchanged. Supabase Auth + demo/dev users.
 *
 *   'external-jwks' — RS256 via a JWKS endpoint. For platform teams that
 *     bring their own IdP (Auth0, Cognito, Clerk, etc.).
 *     Required: VIDHYA_JWKS_URI
 *     Optional: VIDHYA_ROLE_CLAIM_PATH (dot-notation, default 'role')
 *               VIDHYA_SKIP_DB_ROLE_LOOKUP=true (when IdP is authoritative for roles)
 */

import { ServerResponse } from 'http';
import { createHmac, createVerify, createPublicKey } from 'crypto';
import pg from 'pg';
import type { ParsedRequest } from '../lib/route-helpers';

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

// ============================================================================
// HS256 path — Supabase / shared-secret mode (default)
// ============================================================================

function verifyJWT(token: string): { sub: string; email?: string; role?: string } | null {
  const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const signatureInput = `${parts[0]}.${parts[1]}`;
    const expectedSig = createHmac('sha256', secret)
      .update(signatureInput)
      .digest('base64url');

    if (expectedSig !== parts[2]) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    return { sub: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

// ============================================================================
// RS256 / JWKS path — external IdP mode
// ============================================================================

interface JwkKey {
  kid?: string;
  kty: string;
  use?: string;
  n?: string;
  e?: string;
  [k: string]: unknown;
}

interface JwksCache {
  keys: JwkKey[];
  fetchedAt: number;
}

let _jwksCache: JwksCache | null = null;
const JWKS_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchJWKS(uri: string): Promise<JwkKey[]> {
  const now = Date.now();
  if (_jwksCache && now - _jwksCache.fetchedAt < JWKS_TTL_MS) {
    return _jwksCache.keys;
  }
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`[auth] JWKS fetch failed: HTTP ${res.status} from ${uri}`);
  const data = await res.json() as { keys: JwkKey[] };
  if (!Array.isArray(data?.keys)) throw new Error('[auth] JWKS response missing keys array');
  _jwksCache = { keys: data.keys, fetchedAt: now };
  return data.keys;
}

/** Force-expire the cache — used in tests and on 401 refresh cycles. */
export function clearJwksCache(): void {
  _jwksCache = null;
}

/**
 * Extract a value from a JWT payload using dot-notation path.
 * e.g. 'role', 'app_metadata.role', 'https://vidhya.app/role'
 */
function extractClaimValue(payload: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = payload;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Verify an RS256 JWT against a JWKS endpoint.
 * Supports RSA keys (kty=RSA, alg=RS256).
 *
 * Returns the decoded payload on success, null on any failure.
 * On a kid miss, clears the cache and retries once (handles key rotation).
 */
async function verifyJWT_JWKS(token: string): Promise<Record<string, unknown> | null> {
  const uri = process.env.VIDHYA_JWKS_URI;
  if (!uri) {
    console.warn('[auth] VIDHYA_AUTH_MODE=external-jwks but VIDHYA_JWKS_URI is not set');
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString()) as {
      alg?: string;
      kid?: string;
    };

    if (header.alg && header.alg !== 'RS256') {
      console.warn(`[auth] VIDHYA_AUTH_MODE=external-jwks only supports RS256 (got ${header.alg})`);
      return null;
    }

    const keys = await fetchJWKS(uri);

    // Find the matching key by kid; fall back to first RSA key if no kid in header
    let jwk = header.kid
      ? keys.find(k => k.kid === header.kid && k.kty === 'RSA')
      : keys.find(k => k.kty === 'RSA');

    if (!jwk && header.kid) {
      // kid miss — key may have rotated since last cache; refresh and retry once
      clearJwksCache();
      const freshKeys = await fetchJWKS(uri);
      jwk = freshKeys.find(k => k.kid === header.kid && k.kty === 'RSA');
    }

    if (!jwk) {
      console.warn('[auth] No matching RSA key found in JWKS for this token');
      return null;
    }

    const publicKey = createPublicKey({ key: jwk as any, format: 'jwk' });
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${parts[0]}.${parts[1]}`);
    const sig = Buffer.from(parts[2], 'base64url');
    if (!verifier.verify(publicKey, sig)) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as Record<string, unknown>;
    if (typeof payload.exp === 'number' && Date.now() / 1000 > payload.exp) return null;

    return payload;
  } catch (err) {
    console.warn('[auth] JWKS verification error:', (err as Error).message);
    return null;
  }
}

// ============================================================================
// Role normalisation — shared by both paths
// ============================================================================

const VALID_ROLES = new Set(['admin', 'teacher', 'student', 'owner']);

function normaliseRole(raw: string | undefined): UserInfo['role'] {
  if (raw === 'owner') return 'admin';
  if (raw === 'admin' || raw === 'teacher' || raw === 'student') return raw;
  return 'student';
}

// ============================================================================
// getAuth — main entry point
// ============================================================================

/**
 * Extract auth info from request. Returns null if no valid auth.
 *
 * Mode 'supabase' (default) — role-resolution order:
 *   1. CRON_SECRET bearer        → role 'admin' (system)
 *   2. user_profiles row in DB   → that role (canonical for OAuth users)
 *   3. JWT 'role' claim          → demo/dev users without a DB row
 *   4. 'student'                 → safe default
 *
 * Mode 'external-jwks' — role-resolution order:
 *   1. CRON_SECRET bearer                → role 'admin' (system)
 *   2. RS256 verify against JWKS         → fail fast on bad token
 *   3. user_profiles DB lookup           → unless VIDHYA_SKIP_DB_ROLE_LOOKUP=true
 *   4. VIDHYA_ROLE_CLAIM_PATH claim      → IdP is authoritative
 *   5. 'student'                         → safe default
 */
export async function getAuth(req: ParsedRequest): Promise<UserInfo | null> {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;

  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;

  if (token === process.env.CRON_SECRET) {
    return { userId: 'system', role: 'admin' };
  }

  const mode = process.env.VIDHYA_AUTH_MODE || 'supabase';

  // ------------------------------------------------------------------
  // External JWKS path
  // ------------------------------------------------------------------
  if (mode === 'external-jwks') {
    const payload = await verifyJWT_JWKS(token);
    if (!payload) return null;

    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    if (!sub) return null;
    const email = typeof payload.email === 'string' ? payload.email : undefined;

    const skipDbLookup = process.env.VIDHYA_SKIP_DB_ROLE_LOOKUP === 'true';

    if (!skipDbLookup) {
      try {
        const pool = getPool();
        const result = await pool.query('SELECT role FROM user_profiles WHERE id = $1', [sub]);
        if (result.rows.length > 0 && result.rows[0]?.role) {
          return { userId: sub, role: normaliseRole(result.rows[0].role), email };
        }
      } catch {
        // DB unreachable — fall through to claim
      }
    }

    const claimPath = process.env.VIDHYA_ROLE_CLAIM_PATH || 'role';
    const claimRole = extractClaimValue(payload, claimPath);
    return { userId: sub, role: normaliseRole(claimRole), email };
  }

  // ------------------------------------------------------------------
  // Supabase / HS256 path (default — unchanged behaviour)
  // ------------------------------------------------------------------
  const decoded = verifyJWT(token);
  if (!decoded) return null;

  try {
    const pool = getPool();
    const result = await pool.query('SELECT role FROM user_profiles WHERE id = $1', [decoded.sub]);
    if (result.rows.length > 0 && result.rows[0]?.role) {
      return { userId: decoded.sub, role: normaliseRole(result.rows[0].role), email: decoded.email };
    }
    return { userId: decoded.sub, role: normaliseRole(decoded.role), email: decoded.email };
  } catch {
    return { userId: decoded.sub, role: normaliseRole(decoded.role), email: decoded.email };
  }
}

// ============================================================================
// Convenience wrappers
// ============================================================================

export async function requireAuth(req: ParsedRequest, res: ServerResponse): Promise<UserInfo | null> {
  const user = await getAuth(req);
  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Authentication required' }));
    return null;
  }
  return user;
}

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
