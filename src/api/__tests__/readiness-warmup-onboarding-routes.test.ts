/**
 * Tests for the T8 additions to src/api/readiness-routes.ts:
 *   GET  /api/readiness/warmup/spine
 *   POST /api/readiness/warmup/persist
 *
 * `requireRole` is mocked (same pattern as readiness-routes.test.ts) so
 * this file tests route-level parsing + the DB-less honesty contract,
 * independent of a real Postgres connection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerResponse } from 'http';

const mockRequireRole = vi.fn();
vi.mock('../auth-middleware', () => ({
  requireRole: (...args: any[]) => mockRequireRole(...args),
}));

// Spy on the one side-effecting dependency handleWarmupPersist calls after
// auth passes, so an "auth denied" test can assert it was never reached —
// not just that requireRole ran. Defaults to the REAL implementation (every
// other test in this file depends on its actual DB-less/placement behavior)
// so only the auth-denial test needs to override it.
const mockApplyWarmupPriors = vi.fn();
vi.mock('../../readiness/warmup-onboarding', async () => {
  const actual = await vi.importActual<typeof import('../../readiness/warmup-onboarding')>(
    '../../readiness/warmup-onboarding',
  );
  mockApplyWarmupPriors.mockImplementation(actual.applyWarmupPriors);
  return { ...actual, applyWarmupPriors: (...args: unknown[]) => mockApplyWarmupPriors(...args) };
});

const { readinessRoutes } = await import('../readiness-routes');
const { WARMUP_SPINE_CONCEPTS } = await import('../../readiness/warmup-onboarding');

function makeReq(body: unknown = null) {
  return {
    pathname: '/api/readiness/warmup/persist',
    query: new URLSearchParams(),
    params: {},
    body,
    headers: {},
  } as any;
}

function makeRes() {
  const captured: any = { status: 200, payload: null };
  const res: any = {
    setHeader: () => {},
    writeHead: (s: number) => { captured.status = s; },
    end: (d?: string) => { if (d) { try { captured.payload = JSON.parse(d); } catch { captured.payload = d; } } },
    write: () => {},
  };
  Object.defineProperty(res, 'statusCode', {
    get: () => captured.status,
    set: (v: number) => { captured.status = v; },
  });
  return { res: res as ServerResponse, get status() { return captured.status; }, get payload() { return captured.payload; } };
}

const spineHandler = readinessRoutes.find(
  r => r.method === 'GET' && r.path === '/api/readiness/warmup/spine',
)!.handler;
const persistHandler = readinessRoutes.find(
  r => r.method === 'POST' && r.path === '/api/readiness/warmup/persist',
)!.handler;

beforeEach(() => {
  mockRequireRole.mockReset();
  // mockClear (not mockReset): clears call history but keeps the default
  // pass-through-to-actual implementation installed in the vi.mock factory.
  mockApplyWarmupPriors.mockClear();
  delete process.env.DATABASE_URL;
});

describe('GET /api/readiness/warmup/spine', () => {
  it('serves the locked curated concept list, unauthenticated', async () => {
    const r = makeRes();
    await spineHandler(makeReq(), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.concepts.length).toBe(WARMUP_SPINE_CONCEPTS.length);
    expect(r.payload.concepts.map((c: any) => c.id)).toEqual([...WARMUP_SPINE_CONCEPTS]);
    for (const c of r.payload.concepts) {
      expect(typeof c.label).toBe('string');
      expect(c.label.length).toBeGreaterThan(0);
    }
  });
});

describe('POST /api/readiness/warmup/persist', () => {
  it('requires auth: denies the request (non-200) and never reaches the persist path', async () => {
    // Simulate what the REAL requireRole does on denial (auth-middleware.ts:
    // requireAuth/requireRole writes 401/403 itself before returning null) —
    // a mock that just resolves null without touching `res` would let this
    // test pass even if the route forgot its `if (!user) return;` guard,
    // since `res` would then be left at the harness's default 200.
    mockRequireRole.mockImplementationOnce(async (_req: unknown, res: ServerResponse) => {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return null;
    });
    const r = makeRes();
    await persistHandler(makeReq({ results: [] }), r.res);
    expect(mockRequireRole).toHaveBeenCalled();
    expect(r.status).not.toBe(200);
    expect(r.status).toBe(401);
    // The route must not have fallen through to the priors write after a
    // denied auth check.
    expect(mockApplyWarmupPriors).not.toHaveBeenCalled();
  });

  it('rejects a missing/malformed results array', async () => {
    mockRequireRole.mockResolvedValueOnce({ userId: 'student-1', role: 'student' });
    const r = makeRes();
    await persistHandler(makeReq({}), r.res);
    expect(r.status).toBe(400);
  });

  it('rejects a results entry missing skill_id', async () => {
    mockRequireRole.mockResolvedValueOnce({ userId: 'student-1', role: 'student' });
    const r = makeRes();
    await persistHandler(makeReq({ results: [{ ability_estimate: 1200 }] }), r.res);
    expect(r.status).toBe(400);
  });

  it('DB-less: computes placement honestly and reports recorded:false', async () => {
    mockRequireRole.mockResolvedValueOnce({ userId: 'student-1', role: 'student' });
    const r = makeRes();
    await persistHandler(
      makeReq({
        results: [
          { skill_id: 'matrix-operations', converged: true, ability_estimate: 1000, probes_used: 3, predicted_success_at_close: 0.9 },
          { skill_id: 'determinants', converged: true, ability_estimate: 1100, probes_used: 4, predicted_success_at_close: 0.8 },
        ],
      }),
      r.res,
    );
    expect(r.status).toBe(200);
    expect(r.payload.recorded).toBe(false);
    expect(r.payload.placed).toEqual(expect.arrayContaining(['matrix-operations', 'determinants']));
    expect(r.payload.frontier).toBeNull();
  });

  it('converged:false results in the FIRST slot never get placed, and become the frontier', async () => {
    mockRequireRole.mockResolvedValueOnce({ userId: 'student-1', role: 'student' });
    const r = makeRes();
    await persistHandler(
      makeReq({
        results: [
          { skill_id: 'matrix-operations', converged: false, ability_estimate: 900, probes_used: 8, predicted_success_at_close: 0.3 },
        ],
      }),
      r.res,
    );
    expect(r.payload.placed).toEqual([]);
    expect(r.payload.frontier).toBe('matrix-operations');
  });
});
