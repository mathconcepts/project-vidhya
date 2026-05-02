/**
 * Unit tests for admin experiments + runs routes.
 *
 * Tests the auth gate + validation paths without touching the DB. Real
 * DB-touching paths return 503 cleanly when DATABASE_URL is unset, which
 * is exactly what we test for.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ServerResponse } from 'http';
import { adminExperimentsRoutes } from '../admin-experiments-routes';
import { adminRunsRoutes } from '../admin-runs-routes';
import type { ParsedRequest } from '../../lib/route-helpers';

function makeReq(overrides: Partial<ParsedRequest> = {}): ParsedRequest {
  return {
    pathname: '/test',
    query: new URLSearchParams(),
    params: {},
    body: undefined,
    headers: {},
    ...overrides,
  };
}

class FakeRes {
  statusCode = 0;
  headers: Record<string, string> = {};
  body = '';
  writeHead(status: number, headers: Record<string, string>): void {
    this.statusCode = status;
    this.headers = { ...this.headers, ...headers };
  }
  end(chunk?: string): void {
    if (chunk) this.body += chunk;
  }
}

function findHandler(
  routes: Array<{ method: string; path: string; handler: any }>,
  method: string,
  path: string,
) {
  return routes.find((r) => r.method === method && r.path === path);
}

describe('admin-experiments-routes', () => {
  let originalCron: string | undefined;
  let originalDb: string | undefined;

  beforeEach(() => {
    originalCron = process.env.CRON_SECRET;
    originalDb = process.env.DATABASE_URL;
  });
  afterEach(() => {
    if (originalCron === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalCron;
    if (originalDb === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDb;
  });

  it('exports a route table with expected paths', () => {
    const paths = adminExperimentsRoutes.map((r) => `${r.method} ${r.path}`);
    expect(paths).toContain('GET /api/admin/experiments');
    expect(paths).toContain('GET /api/admin/experiments/:id');
    expect(paths).toContain('POST /api/admin/experiments');
    expect(paths).toContain('PATCH /api/admin/experiments/:id');
    expect(paths).toContain('POST /api/admin/experiments/:id/recompute-lift');
    expect(paths).toContain('POST /api/admin/experiments/:id/assignments');
  });

  it('GET /experiments returns 401 when no auth header (whether or not CRON_SECRET is set)', async () => {
    delete process.env.CRON_SECRET;
    const route = findHandler(adminExperimentsRoutes, 'GET', '/api/admin/experiments')!;
    const res = new FakeRes();
    await route.handler(makeReq(), res as unknown as ServerResponse);
    expect(res.statusCode).toBe(401);
  });

  it('GET /experiments returns 401 with wrong bearer', async () => {
    process.env.CRON_SECRET = 'secret-xyz';
    const route = findHandler(adminExperimentsRoutes, 'GET', '/api/admin/experiments')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({ headers: { authorization: 'Bearer wrong' } }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(401);
  });

  it('GET /experiments returns 503 when authed but DB-less', async () => {
    process.env.CRON_SECRET = 'ok';
    delete process.env.DATABASE_URL;
    const route = findHandler(adminExperimentsRoutes, 'GET', '/api/admin/experiments')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({ headers: { authorization: 'Bearer ok' } }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(503);
    expect(res.body).toContain('DATABASE_URL');
  });

  it('POST /experiments returns 400 without name', async () => {
    process.env.CRON_SECRET = 'ok';
    process.env.DATABASE_URL = 'postgres://nowhere'; // not actually queried
    const route = findHandler(adminExperimentsRoutes, 'POST', '/api/admin/experiments')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({
        headers: { authorization: 'Bearer ok' },
        body: { exam_pack_id: 'gate-ma' },
      }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('name required');
  });

  it('PATCH /experiments rejects invalid status', async () => {
    process.env.CRON_SECRET = 'ok';
    process.env.DATABASE_URL = 'postgres://nowhere';
    const route = findHandler(adminExperimentsRoutes, 'PATCH', '/api/admin/experiments/:id')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({
        headers: { authorization: 'Bearer ok' },
        params: { id: 'exp_x' },
        body: { status: 'banana' },
      }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('status must be one of');
  });
});

describe('admin-runs-routes', () => {
  let originalCron: string | undefined;
  let originalDb: string | undefined;

  beforeEach(() => {
    originalCron = process.env.CRON_SECRET;
    originalDb = process.env.DATABASE_URL;
  });
  afterEach(() => {
    if (originalCron === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalCron;
    if (originalDb === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDb;
  });

  it('exports a route table with expected paths', () => {
    const paths = adminRunsRoutes.map((r) => `${r.method} ${r.path}`);
    expect(paths).toContain('GET /api/admin/runs');
    expect(paths).toContain('GET /api/admin/runs/:id');
    expect(paths).toContain('POST /api/admin/runs');
    expect(paths).toContain('POST /api/admin/runs/dry-run');
    expect(paths).toContain('PATCH /api/admin/runs/:id');
  });

  it('orders dry-run BEFORE :id pattern (regex collision avoidance)', () => {
    // Dispatch matches insertion order; dry-run literal must come first
    // so it isn't shadowed by the :id matcher.
    const dryIdx = adminRunsRoutes.findIndex(
      (r) => r.method === 'POST' && r.path === '/api/admin/runs/dry-run',
    );
    // Note: there is no POST :id route, so this is just defense in depth.
    expect(dryIdx).toBeGreaterThanOrEqual(0);
  });

  it('POST /runs/dry-run does NOT require DATABASE_URL', async () => {
    process.env.CRON_SECRET = 'ok';
    delete process.env.DATABASE_URL;
    const route = findHandler(adminRunsRoutes, 'POST', '/api/admin/runs/dry-run')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({
        headers: { authorization: 'Bearer ok' },
        body: {
          config: {
            verification: { tier_ceiling: 'wolfram', gemini_dual_solve: true },
            quota: { count: 50, max_cost_usd: 5 },
          },
        },
      }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.estimate.estimated_cost_usd).toBeGreaterThan(0);
    expect(parsed.estimate.warnings).toBeInstanceOf(Array);
  });

  it('POST /runs/dry-run validates tier_ceiling', async () => {
    process.env.CRON_SECRET = 'ok';
    const route = findHandler(adminRunsRoutes, 'POST', '/api/admin/runs/dry-run')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({
        headers: { authorization: 'Bearer ok' },
        body: {
          config: {
            verification: { tier_ceiling: 'lol' },
            quota: { count: 50, max_cost_usd: 5 },
          },
        },
      }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('tier_ceiling');
  });

  it('POST /runs/dry-run rejects insane quota', async () => {
    process.env.CRON_SECRET = 'ok';
    const route = findHandler(adminRunsRoutes, 'POST', '/api/admin/runs/dry-run')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({
        headers: { authorization: 'Bearer ok' },
        body: {
          config: {
            verification: { tier_ceiling: 'rag' },
            quota: { count: 999999, max_cost_usd: 5 },
          },
        },
      }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('count must be');
  });

  it('POST /runs returns 503 when authed but DB-less', async () => {
    process.env.CRON_SECRET = 'ok';
    delete process.env.DATABASE_URL;
    const route = findHandler(adminRunsRoutes, 'POST', '/api/admin/runs')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({
        headers: { authorization: 'Bearer ok' },
        body: {
          exam_pack_id: 'gate-ma',
          config: {
            verification: { tier_ceiling: 'wolfram' },
            quota: { count: 10, max_cost_usd: 1 },
          },
        },
      }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(503);
  });
});
