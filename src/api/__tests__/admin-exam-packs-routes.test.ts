/**
 * Unit tests for the admin exam-packs routes.
 *
 * Tests the auth gate + validation paths without touching the DB. Real
 * DB-touching paths return 503 cleanly when DATABASE_URL is unset, which
 * is exactly what we test for. The handlers' DB queries are exercised
 * separately via the docker-compose smoke test in PR #31's verification
 * script.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ServerResponse } from 'http';
import { adminExamPacksRoutes } from '../admin-exam-packs-routes';
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

function findHandler(method: string, path: string) {
  return adminExamPacksRoutes.find((r) => r.method === method && r.path === path);
}

describe('admin-exam-packs-routes', () => {
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

  it('exports the expected route table', () => {
    const paths = adminExamPacksRoutes.map((r) => `${r.method} ${r.path}`);
    expect(paths).toContain('GET /api/admin/exam-packs');
    expect(paths).toContain('GET /api/admin/exam-packs/:id');
    expect(paths).toContain('POST /api/admin/exam-packs');
    expect(paths).toContain('PATCH /api/admin/exam-packs/:id');
  });

  it('GET /exam-packs returns 401 without auth', async () => {
    const route = findHandler('GET', '/api/admin/exam-packs')!;
    const res = new FakeRes();
    await route.handler(makeReq(), res as unknown as ServerResponse);
    expect(res.statusCode).toBe(401);
  });

  it('GET /exam-packs returns 503 when authed but DB-less', async () => {
    process.env.CRON_SECRET = 'ok';
    delete process.env.DATABASE_URL;
    const route = findHandler('GET', '/api/admin/exam-packs')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({ headers: { authorization: 'Bearer ok' } }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(503);
    expect(res.body).toContain('DATABASE_URL');
  });

  it('POST /exam-packs returns 400 without name', async () => {
    process.env.CRON_SECRET = 'ok';
    process.env.DATABASE_URL = 'postgres://nowhere';
    const route = findHandler('POST', '/api/admin/exam-packs')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({
        headers: { authorization: 'Bearer ok' },
        body: { config: {} },
      }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('name required');
  });

  it('POST /exam-packs rejects malformed config (non-object)', async () => {
    process.env.CRON_SECRET = 'ok';
    process.env.DATABASE_URL = 'postgres://nowhere';
    const route = findHandler('POST', '/api/admin/exam-packs')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({
        headers: { authorization: 'Bearer ok' },
        body: { name: 'X', config: 'not-an-object' },
      }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('config must be an object');
  });

  it('POST /exam-packs rejects malformed syllabus shape', async () => {
    process.env.CRON_SECRET = 'ok';
    process.env.DATABASE_URL = 'postgres://nowhere';
    const route = findHandler('POST', '/api/admin/exam-packs')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({
        headers: { authorization: 'Bearer ok' },
        body: {
          name: 'X',
          config: { syllabus: [{ id: 123, weight_pct: 'high' }] },
        },
      }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatch(/syllabus\[0\]\.(id|weight_pct)/);
  });

  it('POST /exam-packs rejects reserved canonical slug (gate-ma)', async () => {
    process.env.CRON_SECRET = 'ok';
    process.env.DATABASE_URL = 'postgres://nowhere';
    const route = findHandler('POST', '/api/admin/exam-packs')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({
        headers: { authorization: 'Bearer ok' },
        body: { id: 'gate-ma', name: 'GATE MA Clone', config: {} },
      }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('reserved');
  });

  it('POST /exam-packs rejects empty-after-slugify name', async () => {
    process.env.CRON_SECRET = 'ok';
    process.env.DATABASE_URL = 'postgres://nowhere';
    const route = findHandler('POST', '/api/admin/exam-packs')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({
        headers: { authorization: 'Bearer ok' },
        body: { name: '!!!---', config: {} },
      }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatch(/empty slug/);
  });

  it('PATCH /exam-packs/:id returns 400 with no editable fields', async () => {
    process.env.CRON_SECRET = 'ok';
    process.env.DATABASE_URL = 'postgres://nowhere';
    const route = findHandler('PATCH', '/api/admin/exam-packs/:id')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({
        headers: { authorization: 'Bearer ok' },
        params: { id: 'custom-foo' },
        body: { random_field: true },
      }),
      res as unknown as ServerResponse,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('no editable fields');
  });

  it('PATCH /exam-packs/:id rejects unknown status value', async () => {
    process.env.CRON_SECRET = 'ok';
    process.env.DATABASE_URL = 'postgres://nowhere';
    const route = findHandler('PATCH', '/api/admin/exam-packs/:id')!;
    const res = new FakeRes();
    await route.handler(
      makeReq({
        headers: { authorization: 'Bearer ok' },
        params: { id: 'custom-foo' },
        body: { status: 'bananas' },
      }),
      res as unknown as ServerResponse,
    );
    // status is silently dropped (validated via inclusion check); resulting in
    // no editable fields and a 400. This is the correct behavior.
    expect(res.statusCode).toBe(400);
  });
});
