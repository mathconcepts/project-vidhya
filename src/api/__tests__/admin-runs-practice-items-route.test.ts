/**
 * admin-runs-routes.ts's practice_item_specs handling. Before this, the
 * route silently DROPPED target.practice_item_specs — a run created via
 * POST /api/admin/runs (or estimated via POST /api/admin/runs/dry-run)
 * lost the field entirely, so the wiring in run-dispatcher.ts /
 * dry-run.ts had nothing to read even after both were fixed. This pins:
 *   - a well-formed practice_item_specs[] survives parseRunConfig and
 *     reaches createRun()'s config,
 *   - a malformed entry 400s immediately, naming the exact index + field
 *     (D8), instead of silently dropping or reaching dispatch-time,
 *   - the dry-run endpoint returns a real, mode-mix-aware cost estimate
 *     for a practice-item config.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockRequireRole = vi.hoisted(() => vi.fn());
vi.mock('../auth-middleware', () => ({
  requireRole: mockRequireRole,
}));

const mockCreateRun = vi.hoisted(() => vi.fn());
const mockGetRun = vi.hoisted(() => vi.fn());
const mockListRuns = vi.hoisted(() => vi.fn());
const mockMarkRunFailed = vi.hoisted(() => vi.fn());
vi.mock('../../generation/run-orchestrator', () => ({
  createRun: mockCreateRun,
  getRun: mockGetRun,
  listRuns: mockListRuns,
  markRunFailed: mockMarkRunFailed,
}));

const mockDispatchRun = vi.hoisted(() => vi.fn(async () => {}));
vi.mock('../../generation/run-dispatcher', () => ({
  dispatchRun: mockDispatchRun,
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

function validPracticeItemSpecs() {
  return [
    { concept_id: 'eigenvalues', format: 'mcq', difficulty: 0.5, topic: 'linear-algebra', require_failure_tags: true },
    { concept_id: 'determinants', format: 'nat', difficulty: 0.3, topic: 'linear-algebra' },
  ];
}

function baseBody(target: Record<string, unknown>) {
  return {
    exam_pack_id: 'gate-ma',
    config: {
      target,
      pipeline: { llm_models: ['gemini-2.5-flash'] },
      verification: { tier_ceiling: 'wolfram', wolfram_required: true },
      quota: { count: 2, max_cost_usd: 5 },
    },
  };
}

describe('POST /api/admin/runs — practice_item_specs handling', () => {
  const prevDb = process.env.DATABASE_URL;
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgres://test';
    mockRequireRole.mockReset();
    mockCreateRun.mockReset();
    mockDispatchRun.mockClear();
  });
  afterEach(() => {
    if (prevDb) process.env.DATABASE_URL = prevDb;
    else delete process.env.DATABASE_URL;
  });

  it('threads a well-formed practice_item_specs[] through to createRun (no silent drop)', async () => {
    mockRequireRole.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    mockCreateRun.mockResolvedValue({ id: 'run_1', status: 'queued' });
    const { adminRunsRoutes } = await import('../admin-runs-routes');
    const handler = adminRunsRoutes.find((r) => r.method === 'POST' && r.path === '/api/admin/runs')!.handler;
    const { res, get } = makeMockRes();

    await handler({ body: baseBody({ practice_item_specs: validPracticeItemSpecs() }) } as any, res);

    expect(get().statusCode).toBe(201);
    expect(mockCreateRun).toHaveBeenCalledTimes(1);
    const passedConfig = mockCreateRun.mock.calls[0][0].config;
    expect(passedConfig.target.practice_item_specs).toEqual([
      { concept_id: 'eigenvalues', format: 'mcq', difficulty: 0.5, topic: 'linear-algebra', require_failure_tags: true },
      { concept_id: 'determinants', format: 'nat', difficulty: 0.3, topic: 'linear-algebra', require_failure_tags: false },
    ]);
    expect(mockDispatchRun).toHaveBeenCalledWith('run_1');
  });

  it('400s a malformed spec, naming the exact index + field, and never calls createRun', async () => {
    mockRequireRole.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    const { adminRunsRoutes } = await import('../admin-runs-routes');
    const handler = adminRunsRoutes.find((r) => r.method === 'POST' && r.path === '/api/admin/runs')!.handler;
    const { res, get } = makeMockRes();

    const badSpecs = [{ concept_id: 'eigenvalues', format: 'essay', difficulty: 0.5, topic: 'linear-algebra' }];
    await handler({ body: baseBody({ practice_item_specs: badSpecs }) } as any, res);

    expect(get().statusCode).toBe(400);
    expect(get().body.message).toMatch(/practice_item_specs\[0\]\.format/);
    expect(mockCreateRun).not.toHaveBeenCalled();
  });

  it('400s on an out-of-range difficulty, naming the field', async () => {
    mockRequireRole.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    const { adminRunsRoutes } = await import('../admin-runs-routes');
    const handler = adminRunsRoutes.find((r) => r.method === 'POST' && r.path === '/api/admin/runs')!.handler;
    const { res, get } = makeMockRes();

    const badSpecs = [{ concept_id: 'eigenvalues', format: 'mcq', difficulty: 4, topic: 'linear-algebra' }];
    await handler({ body: baseBody({ practice_item_specs: badSpecs }) } as any, res);

    expect(get().statusCode).toBe(400);
    expect(get().body.message).toMatch(/practice_item_specs\[0\]\.difficulty/);
  });
});

describe('POST /api/admin/runs/dry-run — practice-item cost estimate', () => {
  beforeEach(() => {
    mockRequireRole.mockReset();
  });

  it('returns a positive, mode-mix-aware estimate for a practice-item config', async () => {
    mockRequireRole.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    const { adminRunsRoutes } = await import('../admin-runs-routes');
    const handler = adminRunsRoutes.find((r) => r.method === 'POST' && r.path === '/api/admin/runs/dry-run')!.handler;
    const { res, get } = makeMockRes();

    await handler({ body: baseBody({ practice_item_specs: validPracticeItemSpecs() }) } as any, res);

    expect(get().statusCode).toBe(200);
    const estimate = get().body.estimate;
    expect(estimate.estimated_cost_usd).toBeGreaterThan(0);
    expect(estimate.mode_mix).toEqual({ mcq: 1, msq: 0, nat: 1 });
  });

  it('400s a malformed practice_item_specs entry at dry-run time too', async () => {
    mockRequireRole.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    const { adminRunsRoutes } = await import('../admin-runs-routes');
    const handler = adminRunsRoutes.find((r) => r.method === 'POST' && r.path === '/api/admin/runs/dry-run')!.handler;
    const { res, get } = makeMockRes();

    const badSpecs = [{ concept_id: 'eigenvalues', topic: 'linear-algebra', difficulty: 0.5 }]; // missing format
    await handler({ body: baseBody({ practice_item_specs: badSpecs }) } as any, res);

    expect(get().statusCode).toBe(400);
    expect(get().body.message).toMatch(/practice_item_specs\[0\]\.format/);
  });
});
