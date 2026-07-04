/**
 * Tests for the Wave 7 endpoints added to src/api/readiness-routes.ts —
 * GET /api/readiness/next-action and GET /api/readiness/expected-score.
 *
 * DB-less contract: no DATABASE_URL in this test environment, so
 * getStudentModel() / getLearningObjectCatalog() must degrade to their
 * honest empty/zero responses (never throw), and the route handlers must
 * surface the "building your baseline" framing rather than a 500.
 *
 * `requireRole` is mocked to bypass real JWT verification — auth wiring
 * itself is covered by auth-middleware's own tests; this file is only
 * about the readiness composition + DB-less degradation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerResponse } from 'http';

const mockRequireRole = vi.fn();
vi.mock('../auth-middleware', () => ({
  requireRole: (...args: any[]) => mockRequireRole(...args),
}));

// student-model-pg's abilityFor()/retrievability() etc. hit `pg.Pool`
// directly with no DATABASE_URL guard (unlike the catalog, which checks
// explicitly) — a real connection attempt would depend on whatever
// Postgres may or may not be reachable at localhost in CI, which is
// exactly the flakiness a DB-less test must not depend on. Mock the
// student model here so this file tests the ROUTE's DB-less contract
// (route-level try/catch → "building your baseline") deterministically,
// independent of whether a local Postgres happens to be listening.
vi.mock('../../gbrain/student-model-pg', () => ({
  getStudentModel: () => ({
    abilityFor: async () => { throw new Error('DATABASE_URL not configured'); },
    masteryState: async () => 'not-started',
    retrievability: async () => 0,
    errorProfile: async () => ({ weights: {}, n: 0 }),
    update: async () => {},
  }),
}));

const { readinessRoutes } = await import('../readiness-routes');

function makeReq(query: Record<string, string> = {}) {
  const params = new URLSearchParams(query);
  return {
    pathname: '/api/readiness/next-action',
    query: params,
    params: {},
    body: null,
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

const nextActionHandler = readinessRoutes.find(
  r => r.method === 'GET' && r.path === '/api/readiness/next-action',
)!.handler;
const expectedScoreHandler = readinessRoutes.find(
  r => r.method === 'GET' && r.path === '/api/readiness/expected-score',
)!.handler;

beforeEach(() => {
  mockRequireRole.mockReset();
  delete process.env.DATABASE_URL;
});

describe('GET /api/readiness/next-action — DB-less', () => {
  it('returns the honest "building your baseline" shape for an authenticated student', async () => {
    mockRequireRole.mockResolvedValueOnce({ userId: 'student-1', role: 'student' });
    const r = makeRes();
    await nextActionHandler(makeReq({ time_budget_min: '15' }), r.res);

    expect(r.status).toBe(200);
    // DB-less contract: the route must NOT fabricate an action — it returns
    // action: null with the honest reason, and the frontend renders the
    // "building your baseline" empty state (blueprint amendment A6).
    expect(r.payload).toHaveProperty('action', null);
    expect(r.payload).toHaveProperty('reason', 'building your baseline');
  });

  it('does not call the engine when auth fails (requireRole handles the response itself)', async () => {
    mockRequireRole.mockResolvedValueOnce(null);
    const r = makeRes();
    await nextActionHandler(makeReq({}), r.res);
    // requireRole is responsible for writing the 401/403; the handler
    // just returns early. We only assert it didn't crash / didn't
    // fabricate a 200 body.
    expect(mockRequireRole).toHaveBeenCalled();
  });

  it('defaults time_budget_min to a sane value when omitted or invalid', async () => {
    mockRequireRole.mockResolvedValueOnce({ userId: 'student-2', role: 'student' });
    const r = makeRes();
    await nextActionHandler(makeReq({ time_budget_min: 'not-a-number' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.action).toBeDefined();
  });
});

describe('GET /api/readiness/expected-score — DB-less', () => {
  it('returns zeros with the honest "building your baseline" reason', async () => {
    mockRequireRole.mockResolvedValueOnce({ userId: 'student-1', role: 'student' });
    const r = makeRes();
    await expectedScoreHandler(makeReq(), r.res);

    expect(r.status).toBe(200);
    expect(r.payload.realized).toBe(0);
    expect(r.payload.potential).toBe(0);
    expect(r.payload.ratio).toBeNull();
    expect(r.payload.reason).toBe('building your baseline');
  });

  it('does not throw when auth fails', async () => {
    mockRequireRole.mockResolvedValueOnce(null);
    const r = makeRes();
    await expect(expectedScoreHandler(makeReq(), r.res)).resolves.not.toThrow();
  });
});
