/**
 * Tests for VIDHYA_AUTH_MODE=external-jwks path in auth-middleware.
 *
 * Uses real RSA key generation + signing so the RS256 verification is
 * exercised end-to-end — no mocking of crypto primitives.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateKeyPairSync,
  createSign,
  createPublicKey,
} from 'crypto';
import { clearJwksCache } from '../auth-middleware';

// ---------------------------------------------------------------------------
// Helpers — build a real RS256 JWT signed with a test key pair
// ---------------------------------------------------------------------------

function buildRSAKeyPair() {
  return generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

function pemToJwk(publicPem: string, kid = 'test-key-1'): object {
  const key = createPublicKey(publicPem);
  const jwk = key.export({ format: 'jwk' }) as Record<string, unknown>;
  return { ...jwk, kid, use: 'sig', alg: 'RS256' };
}

function signJWT(
  payload: Record<string, unknown>,
  privateKeyPem: string,
  kid = 'test-key-1',
): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${body}`);
  const sig = signer.sign(privateKeyPem, 'base64url');
  return `${header}.${body}.${sig}`;
}

function makePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sub: 'user-uuid-123',
    email: 'test@example.com',
    role: 'teacher',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Minimal ParsedRequest stub
// ---------------------------------------------------------------------------

function makeReq(token: string | null): any {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
}

// ---------------------------------------------------------------------------
// Env var helpers
// ---------------------------------------------------------------------------

function withEnv(vars: Record<string, string | undefined>, fn: () => Promise<void>): Promise<void> {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return fn().finally(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('VIDHYA_AUTH_MODE=external-jwks', () => {
  const { publicKey: publicPem, privateKey: privatePem } = buildRSAKeyPair();
  const jwk = pemToJwk(publicPem, 'test-key-1');
  const jwksPayload = JSON.stringify({ keys: [jwk] });

  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearJwksCache();
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => JSON.parse(jwksPayload),
    });
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    clearJwksCache();
    vi.restoreAllMocks();
  });

  it('verifies a valid RS256 JWT and returns UserInfo', async () => {
    const { getAuth } = await import('../auth-middleware');
    const token = signJWT(makePayload(), privatePem);

    const result = await withEnv(
      {
        VIDHYA_AUTH_MODE: 'external-jwks',
        VIDHYA_JWKS_URI: 'https://idp.example.com/.well-known/jwks.json',
        VIDHYA_ROLE_CLAIM_PATH: 'role',
        VIDHYA_SKIP_DB_ROLE_LOOKUP: 'true',
        DATABASE_URL: undefined,
      },
      async () => getAuth(makeReq(token)),
    );

    expect(result).not.toBeNull();
    expect(result!.userId).toBe('user-uuid-123');
    expect(result!.email).toBe('test@example.com');
    expect(result!.role).toBe('teacher');
  });

  it('rejects an expired JWT', async () => {
    const { getAuth } = await import('../auth-middleware');
    const token = signJWT(makePayload({ exp: Math.floor(Date.now() / 1000) - 10 }), privatePem);

    const result = await withEnv(
      {
        VIDHYA_AUTH_MODE: 'external-jwks',
        VIDHYA_JWKS_URI: 'https://idp.example.com/.well-known/jwks.json',
        VIDHYA_SKIP_DB_ROLE_LOOKUP: 'true',
        DATABASE_URL: undefined,
      },
      async () => getAuth(makeReq(token)),
    );

    expect(result).toBeNull();
  });

  it('rejects a token signed with the wrong key', async () => {
    const { getAuth } = await import('../auth-middleware');
    const { privateKey: wrongPrivate } = buildRSAKeyPair();
    const token = signJWT(makePayload(), wrongPrivate);

    const result = await withEnv(
      {
        VIDHYA_AUTH_MODE: 'external-jwks',
        VIDHYA_JWKS_URI: 'https://idp.example.com/.well-known/jwks.json',
        VIDHYA_SKIP_DB_ROLE_LOOKUP: 'true',
        DATABASE_URL: undefined,
      },
      async () => getAuth(makeReq(token)),
    );

    expect(result).toBeNull();
  });

  it('returns null when no bearer token is present', async () => {
    const { getAuth } = await import('../auth-middleware');
    const result = await withEnv(
      { VIDHYA_AUTH_MODE: 'external-jwks', VIDHYA_JWKS_URI: 'https://idp.example.com/.well-known/jwks.json' },
      async () => getAuth(makeReq(null)),
    );
    expect(result).toBeNull();
  });

  it('CRON_SECRET still grants admin regardless of auth mode', async () => {
    const { getAuth } = await import('../auth-middleware');
    const result = await withEnv(
      {
        VIDHYA_AUTH_MODE: 'external-jwks',
        VIDHYA_JWKS_URI: 'https://idp.example.com/.well-known/jwks.json',
        CRON_SECRET: 'super-secret-cron',
      },
      async () => getAuth({ headers: { authorization: 'Bearer super-secret-cron' } } as any),
    );
    expect(result).not.toBeNull();
    expect(result!.role).toBe('admin');
    expect(result!.userId).toBe('system');
  });

  it('extracts role from a nested claim path (app_metadata.role)', async () => {
    const { getAuth } = await import('../auth-middleware');
    const payload = makePayload({ role: undefined, app_metadata: { role: 'admin' } });
    const token = signJWT(payload, privatePem);

    const result = await withEnv(
      {
        VIDHYA_AUTH_MODE: 'external-jwks',
        VIDHYA_JWKS_URI: 'https://idp.example.com/.well-known/jwks.json',
        VIDHYA_ROLE_CLAIM_PATH: 'app_metadata.role',
        VIDHYA_SKIP_DB_ROLE_LOOKUP: 'true',
        DATABASE_URL: undefined,
      },
      async () => getAuth(makeReq(token)),
    );

    expect(result!.role).toBe('admin');
  });

  it("normalises 'owner' claim to 'admin'", async () => {
    const { getAuth } = await import('../auth-middleware');
    const token = signJWT(makePayload({ role: 'owner' }), privatePem);

    const result = await withEnv(
      {
        VIDHYA_AUTH_MODE: 'external-jwks',
        VIDHYA_JWKS_URI: 'https://idp.example.com/.well-known/jwks.json',
        VIDHYA_ROLE_CLAIM_PATH: 'role',
        VIDHYA_SKIP_DB_ROLE_LOOKUP: 'true',
        DATABASE_URL: undefined,
      },
      async () => getAuth(makeReq(token)),
    );

    expect(result!.role).toBe('admin');
  });

  it("defaults to 'student' for unrecognised role claim", async () => {
    const { getAuth } = await import('../auth-middleware');
    const token = signJWT(makePayload({ role: 'mystery-role' }), privatePem);

    const result = await withEnv(
      {
        VIDHYA_AUTH_MODE: 'external-jwks',
        VIDHYA_JWKS_URI: 'https://idp.example.com/.well-known/jwks.json',
        VIDHYA_SKIP_DB_ROLE_LOOKUP: 'true',
        DATABASE_URL: undefined,
      },
      async () => getAuth(makeReq(token)),
    );

    expect(result!.role).toBe('student');
  });

  it('falls back to supabase HS256 path when mode is not set', async () => {
    const { getAuth } = await import('../auth-middleware');
    // No valid HS256 secret → null (not a JWKS path)
    const result = await withEnv(
      {
        VIDHYA_AUTH_MODE: undefined,
        JWT_SECRET: undefined,
        SUPABASE_JWT_SECRET: undefined,
        DATABASE_URL: undefined,
      },
      async () => getAuth(makeReq('not-a-valid-token')),
    );
    expect(result).toBeNull();
    // Fetch should NOT have been called for the JWKS
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('warns and returns null when VIDHYA_JWKS_URI is unset in external-jwks mode', async () => {
    const { getAuth } = await import('../auth-middleware');
    const token = signJWT(makePayload(), privatePem);

    const result = await withEnv(
      {
        VIDHYA_AUTH_MODE: 'external-jwks',
        VIDHYA_JWKS_URI: undefined,
        VIDHYA_SKIP_DB_ROLE_LOOKUP: 'true',
      },
      async () => getAuth(makeReq(token)),
    );

    expect(result).toBeNull();
  });
});
