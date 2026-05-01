/**
 * verify-routes — local check + Wolfram fall-through.
 *
 * The Wolfram path is only exercised when WOLFRAM_APP_ID is set; in CI it is
 * not, so these tests verify the local-check path and the request validation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { verifyRoutes } from '../verify-routes';

function makeMockRes() {
  let statusCode = 200;
  let body: any = null;
  let headers: Record<string, string> = {};
  const res: any = {
    setHeader: (k: string, v: string) => { headers[k] = v; },
    writeHead: (s: number, h?: any) => { statusCode = s; if (h) headers = { ...headers, ...h }; },
    end: (b: any) => { body = typeof b === 'string' ? b : String(b); },
    statusCode: 200,
  };
  return { res, get: () => ({ statusCode, body: body ? JSON.parse(body) : null, headers }) };
}

const handler = verifyRoutes.find((r) => r.path === '/api/lesson/verify')!.handler;

describe('verify-routes — local check', () => {
  const originalEnv = process.env.WOLFRAM_APP_ID;
  beforeEach(() => { delete process.env.WOLFRAM_APP_ID; });
  afterEach(() => { if (originalEnv) process.env.WOLFRAM_APP_ID = originalEnv; });

  it('400 when student_input is missing', async () => {
    const { res, get } = makeMockRes();
    await handler({ body: { expected: '2*x' } } as any, res);
    expect(get().statusCode).toBe(400);
  });

  it('400 when expected is missing', async () => {
    const { res, get } = makeMockRes();
    await handler({ body: { student_input: '2*x' } } as any, res);
    expect(get().statusCode).toBe(400);
  });

  it('verifies an exact match', async () => {
    const { res, get } = makeMockRes();
    await handler({ body: { student_input: '2*x', expected: '2*x' } } as any, res);
    expect(get().body.status).toBe('verified');
    expect(get().body.source).toBe('local');
  });

  it('verifies modulo whitespace and *', async () => {
    const { res, get } = makeMockRes();
    await handler({ body: { student_input: '2 x', expected: '2*x' } } as any, res);
    expect(get().body.status).toBe('verified');
  });

  it('returns inconclusive (not failed) for non-trivial cases', async () => {
    const { res, get } = makeMockRes();
    await handler({ body: { student_input: '2x + 1', expected: '2*x' } } as any, res);
    expect(get().body.status).toBe('inconclusive');
  });
});

describe('verify-routes — Wolfram path', () => {
  beforeEach(() => {
    process.env.WOLFRAM_APP_ID = 'test-app-id';
  });
  afterEach(() => {
    delete process.env.WOLFRAM_APP_ID;
    vi.unstubAllGlobals();
  });

  it('verifies when Wolfram simplifies to 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        queryresult: { pods: [{ subpods: [{ plaintext: '0' }] }] },
      }),
    }));
    const { res, get } = makeMockRes();
    await handler({ body: { student_input: '2*x', expected: '2*x' } } as any, res);
    expect(get().body.status).toBe('verified');
    expect(get().body.source).toBe('wolfram');
  });

  it('marks failed for non-zero numeric residue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        queryresult: { pods: [{ subpods: [{ plaintext: '1' }] }] },
      }),
    }));
    const { res, get } = makeMockRes();
    await handler({ body: { student_input: '2*x + 1', expected: '2*x' } } as any, res);
    expect(get().body.status).toBe('failed');
  });

  it('inconclusive on Wolfram timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    const { res, get } = makeMockRes();
    await handler({ body: { student_input: '2*x', expected: '2*x' } } as any, res);
    expect(get().body.status).toBe('inconclusive');
    expect(get().body.detail).toBe('timeout');
  });
});
