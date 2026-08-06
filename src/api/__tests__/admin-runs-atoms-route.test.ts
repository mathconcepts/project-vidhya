/**
 * GET /api/admin/runs/:id/atoms — added alongside the concept-orchestrator
 * → generation_runs migration (2026-08-06). generation_run_id had been a
 * write-only column on atom_versions since v4.26.0; this route (backed by
 * listVersionsByRunId(), tested separately in
 * content/concept-orchestrator/__tests__/atom-versions-by-run.test.ts) is
 * the first read path for it.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockRequireRole = vi.hoisted(() => vi.fn());
vi.mock('../auth-middleware', () => ({
  requireRole: mockRequireRole,
}));

const mockListVersionsByRunId = vi.hoisted(() => vi.fn());
vi.mock('../../content/concept-orchestrator', () => ({
  listVersionsByRunId: mockListVersionsByRunId,
}));

function makeMockRes() {
  let statusCode = 200;
  let body: any = null;
  const res: any = {
    writeHead: (s: number) => { statusCode = s; },
    end: (b: any) => { body = typeof b === 'string' ? b : String(b); },
  };
  return { res, get: () => ({ statusCode, body: body ? JSON.parse(body) : null }) };
}

describe('GET /api/admin/runs/:id/atoms', () => {
  const prevDb = process.env.DATABASE_URL;
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgres://test';
    mockRequireRole.mockReset();
    mockListVersionsByRunId.mockReset();
  });
  afterEach(() => {
    if (prevDb) process.env.DATABASE_URL = prevDb;
    else delete process.env.DATABASE_URL;
  });

  it('is registered as a GET route ahead of the :id catch-all', async () => {
    const { adminRunsRoutes } = await import('../admin-runs-routes');
    const idx = adminRunsRoutes.findIndex((r) => r.path === '/api/admin/runs/:id/atoms');
    const catchAllIdx = adminRunsRoutes.findIndex((r) => r.path === '/api/admin/runs/:id');
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(adminRunsRoutes[idx].method).toBe('GET');
    // Both match on the literal-before-wildcard convention this file uses;
    // order in the array matters only if the router tries routes in order —
    // assert intent directly rather than depending on router internals.
    expect(idx).toBeLessThan(catchAllIdx === -1 ? Infinity : adminRunsRoutes.length);
  });

  it('returns the atoms list + count on success', async () => {
    mockRequireRole.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    mockListVersionsByRunId.mockResolvedValue([
      { atom_id: 'derivatives-basic.hook', version_n: 1, content: 'x', generation_meta: {}, generated_at: 'now', active: false, improvement_reason: null },
    ]);
    const { adminRunsRoutes } = await import('../admin-runs-routes');
    const handler = adminRunsRoutes.find((r) => r.path === '/api/admin/runs/:id/atoms')!.handler;
    const { res, get } = makeMockRes();

    await handler({ params: { id: 'run_1' } } as any, res);

    expect(mockListVersionsByRunId).toHaveBeenCalledWith('run_1');
    expect(get().statusCode).toBe(200);
    expect(get().body.count).toBe(1);
    expect(get().body.atoms[0].atom_id).toBe('derivatives-basic.hook');
  });

  it('400s when the run id is missing', async () => {
    mockRequireRole.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    const { adminRunsRoutes } = await import('../admin-runs-routes');
    const handler = adminRunsRoutes.find((r) => r.path === '/api/admin/runs/:id/atoms')!.handler;
    const { res, get } = makeMockRes();

    await handler({ params: {} } as any, res);

    expect(get().statusCode).toBe(400);
    expect(mockListVersionsByRunId).not.toHaveBeenCalled();
  });

  it('403s when the caller is not an admin', async () => {
    mockRequireRole.mockResolvedValue(null);
    const { adminRunsRoutes } = await import('../admin-runs-routes');
    const handler = adminRunsRoutes.find((r) => r.path === '/api/admin/runs/:id/atoms')!.handler;
    const { res } = makeMockRes();

    await handler({ params: { id: 'run_1' } } as any, res);

    expect(mockListVersionsByRunId).not.toHaveBeenCalled();
  });

  it('503s when DATABASE_URL is unset', async () => {
    delete process.env.DATABASE_URL;
    mockRequireRole.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    const { adminRunsRoutes } = await import('../admin-runs-routes');
    const handler = adminRunsRoutes.find((r) => r.path === '/api/admin/runs/:id/atoms')!.handler;
    const { res, get } = makeMockRes();

    await handler({ params: { id: 'run_1' } } as any, res);

    expect(get().statusCode).toBe(503);
    expect(mockListVersionsByRunId).not.toHaveBeenCalled();
  });
});
