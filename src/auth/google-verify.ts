// @ts-nocheck
/**
 * Google ID Token Verification
 *
 * Verifies Google-issued ID tokens against Google's public JWKs.
 * No external dependency — uses Node's built-in crypto.
 *
 * JWKs are fetched from https://www.googleapis.com/oauth2/v3/certs
 * and cached for the duration specified by Cache-Control max-age.
 */

import crypto from 'crypto';

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUER = 'https://accounts.google.com';
const GOOGLE_ISSUER_ALT = 'accounts.google.com'; // Google alternately uses this

interface GoogleJWK {
  kid: string;
  kty: 'RSA';
  n: string;
  e: string;
  alg: 'RS256';
  use: 'sig';
}

interface CertsCache {
  keys: GoogleJWK[];
  expires_at: number;
}

let _cache: CertsCache | null = null;

async function fetchGoogleCerts(): Promise<GoogleJWK[]> {
  if (_cache && _cache.expires_at > Date.now()) return _cache.keys;
  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) throw new Error(`Google certs fetch failed: HTTP ${res.status}`);
  const cacheControl = res.headers.get('cache-control') || '';
  const maxAge = /max-age=(\d+)/.exec(cacheControl);
  const ttlMs = maxAge ? Math.min(parseInt(maxAge[1], 10) * 1000, 3600_000) : 3600_000;
  const json = await res.json();
  _cache = { keys: json.keys, expires_at: Date.now() + ttlMs };
  return json.keys;
}

/**
 * JWK (n, e) → PEM SubjectPublicKeyInfo so Node's crypto.verify accepts it.
 */
function jwkToPem(jwk: GoogleJWK): string {
  const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  return key.export({ type: 'spki', format: 'pem' }) as string;
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  aud: string;
  iss: string;
}

/**
 * Verify a Google ID token. Returns the identity on success, null on failure.
 *
 * @param id_token - the raw JWT from Google
 * @param expected_audience - your Google OAuth client ID (must match the `aud` claim)
 */
export async function verifyGoogleIdToken(
  id_token: string,
  expected_audience: string,
): Promise<GoogleIdentity | null> {
  try {
    const parts = id_token.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (header.alg !== 'RS256') return null;

    // Find the JWK with the matching kid
    const certs = await fetchGoogleCerts();
    const jwk = certs.find(k => k.kid === header.kid);
    if (!jwk) return null;

    // Verify signature
    const signatureInput = Buffer.from(`${parts[0]}.${parts[1]}`);
    const signature = Buffer.from(parts[2], 'base64url');
    const pem = jwkToPem(jwk);
    const valid = crypto.verify('RSA-SHA256', signatureInput, pem, signature);
    if (!valid) return null;

    // Claim checks
    if (payload.iss !== GOOGLE_ISSUER && payload.iss !== GOOGLE_ISSUER_ALT) return null;
    if (payload.aud !== expected_audience) return null;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.email_verified) return null;

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: !!payload.email_verified,
      name: payload.name || payload.email,
      picture: payload.picture,
      aud: payload.aud,
      iss: payload.iss,
    };
  } catch (err) {
    console.error('[google-verify]', (err as Error).message);
    return null;
  }
}
