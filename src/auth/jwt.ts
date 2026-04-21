// @ts-nocheck
/**
 * Vidhya JWT — lightweight session tokens
 *
 * HS256 signed with JWT_SECRET (same key already used by existing
 * auth-middleware). 30-day expiry by default.
 */

import crypto from 'crypto';

const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

interface VidhyaClaims {
  sub: string;            // user.id
  role: string;           // role at issue time (not authoritative — always re-check)
  iat: number;
  exp: number;
}

function getSecret(): string {
  const s = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error('JWT_SECRET required (min 16 chars). Add it to .env');
  }
  return s;
}

function b64url(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return b.toString('base64url');
}

export function issueToken(params: { user_id: string; role: string; ttl_seconds?: number }): string {
  const secret = getSecret();
  const ttl = params.ttl_seconds ?? DEFAULT_TTL_SECONDS;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const claims: VidhyaClaims = {
    sub: params.user_id,
    role: params.role,
    iat: now,
    exp: now + ttl,
  };
  const headerB = b64url(JSON.stringify(header));
  const claimsB = b64url(JSON.stringify(claims));
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${headerB}.${claimsB}`)
    .digest('base64url');
  return `${headerB}.${claimsB}.${sig}`;
}

export function verifyToken(token: string): VidhyaClaims | null {
  try {
    const secret = getSecret();
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${parts[0]}.${parts[1]}`)
      .digest('base64url');
    // timing-safe comparison
    if (parts[2].length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(parts[2]), Buffer.from(expected))) return null;
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (typeof claims.exp !== 'number' || claims.exp < Math.floor(Date.now() / 1000)) return null;
    if (!claims.sub) return null;
    return claims as VidhyaClaims;
  } catch {
    return null;
  }
}
