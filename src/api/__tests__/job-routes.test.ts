/**
 * job-routes tests (content-pipeline realignment plan, item 4):
 * admin auth gate (401 without credentials) and the 409 single-flight
 * semantics on concurrent start, exercised through the real handlers
 * with the auth middleware mocked to an admin identity where needed.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { ServerResponse } from 'http';

// Default: real middleware behavior (401 without a token). Individual
// tests flip the mock to an authenticated admin.
vi.mock('../../auth/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../auth/middleware')>();
  return {
    ...actual,
    requireAnyRole: vi.fn(actual.requireAnyRole),
  };
});

import { requireAnyRole } from '../../auth/middleware';
import { jobRoutes } from '../job-routes';
import {
  registerJob,
  startJob,
  __testing as runnerTesting,
} from '../../jobs/job-runner';

const mockedRequireAnyRole = vi.mocked(requireAnyRole);

function findHandler(method: string, routePath: string) {
  const r = jobRoutes.find((x) => x.method === method && x.path === routePath);
  if (!r) throw new Error(`route not found: ${method} ${routePath}`);
  return r.handler;
}

interface FakeRes {
  statusCode: number;
  body: any;
}

function makeRes(): { res: ServerResponse; out: FakeRes } {
  const out: FakeRes = { statusCode: 0, body: null };
  const res = {
    writeHead(code: number) { out.statusCode = code; return res; },
    end(payload?: string) { out.body = payload ? JSON.parse(payload) : null; },
  } as unknown as ServerResponse;
  return { res, out };
}

function makeReq(params: Record<string, string> = {}) {
  return {
    pathname: '/api/admin/jobs',
    query: new URLSearchParams(),
    params,
    body: {},
    headers: {},
  };
}

function actAsAdmin(): void {
  mockedRequireAnyRole.mockResolvedValue({
    user: { id: 'admin-1', role: 'admin' },
    token_exp: Date.now() / 1000 + 3600,
  } as any);
}

let tmp: string;
let origJobsDir: string | undefined;
let origDisabled: string | undefined;
let counter = 0;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'job-routes-'));
  origJobsDir = process.env.VIDHYA_JOBS_DIR;
  origDisabled = process.env.CONTENT_JOBS_DISABLED;
  process.env.VIDHYA_JOBS_DIR = tmp;
  delete process.env.CONTENT_JOBS_DISABLED;
  runnerTesting.resetRuntimeForTests();
  mockedRequireAnyRole.mockReset();
});

afterEach(() => {
  if (origJobsDir === undefined) delete process.env.VIDHYA_JOBS_DIR;
  else process.env.VIDHYA_JOBS_DIR = origJobsDir;
  if (origDisabled === undefined) delete process.env.CONTENT_JOBS_DISABLED;
  else process.env.CONTENT_JOBS_DISABLED = origDisabled;
  fs.rmSync(tmp, { recursive: true, force: true });
});

function registerTestJob(opts?: { hold?: Promise<void> }): string {
  const name = `route-test-job-${++counter}`;
  registerJob({
    name,
    description: 'route test job',
    run: async (ctx) => {
      await ctx.processItems([{ key: 'only' }], async () => {
        if (opts?.hold) await opts.hold;
      });
    },
  });
  return name;
}

describe('auth gate', () => {
  it('unauthenticated requests get 401 from the real middleware on every route', async () => {
    // Use the REAL middleware (no token in headers → 401).
    const actual = await vi.importActual<typeof import('../../auth/middleware')>('../../auth/middleware');
    mockedRequireAnyRole.mockImplementation(actual.requireAnyRole);

    for (const [method, routePath, params] of [
      ['GET', '/api/admin/jobs', {}],
      ['POST', '/api/admin/jobs/:name/start', { name: 'wolfram-verify' }],
      ['GET', '/api/admin/jobs/:name/status', { name: 'wolfram-verify' }],
      ['POST', '/api/admin/jobs/:name/cancel', { name: 'wolfram-verify' }],
    ] as const) {
      const { res, out } = makeRes();
      await findHandler(method, routePath)(makeReq(params as Record<string, string>) as any, res);
      expect(out.statusCode, `${method} ${routePath}`).toBe(401);
      expect(out.body.error).toContain('authentication required');
    }
  });
});

describe('start + 409 semantics', () => {
  it('starting a running job returns 409 with the existing status', async () => {
    actAsAdmin();
    let release: () => void = () => {};
    const hold = new Promise<void>((r) => { release = r; });
    const name = registerTestJob({ hold });
    const start = findHandler('POST', '/api/admin/jobs/:name/start');

    const first = makeRes();
    await start(makeReq({ name }) as any, first.res);
    expect(first.out.statusCode).toBe(202);
    expect(first.out.body.started).toBe(true);
    expect(first.out.body.status.state).toBe('running');

    const second = makeRes();
    await start(makeReq({ name }) as any, second.res);
    expect(second.out.statusCode).toBe(409);
    expect(second.out.body.error).toContain('already running');
    expect(second.out.body.status.state).toBe('running');

    release();
    // Drain: wait for completion so the lock frees before the next test.
    const statusHandler = findHandler('GET', '/api/admin/jobs/:name/status');
    await new Promise((r) => setTimeout(r, 20));
    const status = makeRes();
    await statusHandler(makeReq({ name }) as any, status.res);
    expect(status.out.body.state).toBe('completed');
  });

  it('unknown job names get 404', async () => {
    actAsAdmin();
    const { res, out } = makeRes();
    await findHandler('POST', '/api/admin/jobs/:name/start')(makeReq({ name: 'no-such-job' }) as any, res);
    expect(out.statusCode).toBe(404);
  });

  it('the kill switch maps to 503', async () => {
    actAsAdmin();
    process.env.CONTENT_JOBS_DISABLED = 'true';
    const name = registerTestJob();
    const { res, out } = makeRes();
    await findHandler('POST', '/api/admin/jobs/:name/start')(makeReq({ name }) as any, res);
    expect(out.statusCode).toBe(503);
    expect(out.body.error).toContain('CONTENT_JOBS_DISABLED');
  });
});

describe('status + cancel + list', () => {
  it('status reports idle for a registered job that never ran', async () => {
    actAsAdmin();
    const name = registerTestJob();
    const { res, out } = makeRes();
    await findHandler('GET', '/api/admin/jobs/:name/status')(makeReq({ name }) as any, res);
    expect(out.statusCode).toBe(200);
    expect(out.body.state).toBe('idle');
    expect(out.body.status).toBeNull();
  });

  it('cancel on a non-running job returns 409', async () => {
    actAsAdmin();
    const name = registerTestJob();
    const { res, out } = makeRes();
    await findHandler('POST', '/api/admin/jobs/:name/cancel')(makeReq({ name }) as any, res);
    expect(out.statusCode).toBe(409);
    expect(out.body.error).toContain('not running');
  });

  it('cancel on a running job acknowledges and the job ends cancelled', async () => {
    actAsAdmin();
    let release: () => void = () => {};
    const hold = new Promise<void>((r) => { release = r; });
    const name = `route-cancel-job-${++counter}`;
    registerJob({
      name,
      description: 'cancellable',
      run: async (ctx) => {
        await ctx.processItems([{ key: 'a' }, { key: 'b' }], async ({ key }) => {
          if (key === 'a') await hold;
        });
      },
    });
    const startResult = await startJob(name);
    expect(startResult.ok).toBe(true);

    const { res, out } = makeRes();
    await findHandler('POST', '/api/admin/jobs/:name/cancel')(makeReq({ name }) as any, res);
    expect(out.statusCode).toBe(200);
    expect(out.body.cancelling).toBe(true);

    release();
    if (startResult.ok) {
      const final = await startResult.completion;
      expect(final.state).toBe('cancelled');
    }
  });

  it('list includes the registered content jobs', async () => {
    actAsAdmin();
    const { res, out } = makeRes();
    await findHandler('GET', '/api/admin/jobs')(makeReq() as any, res);
    expect(out.statusCode).toBe(200);
    const names = out.body.jobs.map((j: any) => j.name);
    expect(names).toContain('content-generation');
    expect(names).toContain('wolfram-verify');
  });
});
