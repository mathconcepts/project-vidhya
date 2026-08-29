// @ts-nocheck
/**
 * Tests for the founder-os routes on src/api/operator-routes.ts.
 *
 * "Complete AND Paid" is master-rights territory — a strict superset of
 * what admin can reach — so the main thing under test is that requireOwner
 * actually distinguishes 'owner' from 'admin' (and everything below),
 * unlike the older /api/operator/dashboard endpoints which treat admin and
 * owner as equally privileged. getCurrentUser is mocked; founder-os itself
 * runs for real against a scratch .data/ dir, same convention as
 * operator.test.ts.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { ServerResponse } from 'http';
import { mkdirSync, existsSync, rmSync, cpSync } from 'fs';

let currentUser: { role: string } | null = { role: 'owner' };

vi.mock('../../auth/middleware', () => ({
  getCurrentUser: async () => (currentUser ? { user: { id: 'u1', role: currentUser.role }, token_exp: 0 } : null),
}));

const { operatorRoutes } = await import('../operator-routes');

const viewHandler = operatorRoutes.find(r => r.method === 'GET' && r.path === '/api/operator/founder-os')!.handler;
const createHandler = operatorRoutes.find(r => r.method === 'POST' && r.path === '/api/operator/founder-os/milestones')!.handler;
const updateHandler = operatorRoutes.find(r => r.method === 'PATCH' && r.path === '/api/operator/founder-os/milestones/:id')!.handler;
const deleteHandler = operatorRoutes.find(r => r.method === 'DELETE' && r.path === '/api/operator/founder-os/milestones/:id')!.handler;
const settingsHandler = operatorRoutes.find(r => r.method === 'PATCH' && r.path === '/api/operator/founder-os/settings')!.handler;

function makeReq(body: unknown = {}, params: Record<string, string> = {}, query: Record<string, string> = {}) {
  return { pathname: '/', query: new URLSearchParams(query), params, body, headers: {} } as any;
}

// NOTE: `status`/`payload` are getters — always read them via `r.status` /
// `r.payload` AFTER the handler has run, never destructure them up front
// (destructuring snapshots the getter's value at that instant, which is
// always the pre-request default).
function makeRes() {
  const captured: any = { status: 200, payload: null };
  const res: any = {
    setHeader: () => {},
    writeHead: (s: number) => { captured.status = s; },
    end: (d?: string) => { if (d) { try { captured.payload = JSON.parse(d); } catch { captured.payload = d; } } },
    write: () => {},
  };
  return { res: res as ServerResponse, get status() { return captured.status; }, get payload() { return captured.payload; } };
}

let savedBackup = '';

beforeAll(() => {
  if (existsSync('.data')) {
    savedBackup = `.data.founder-os-routes-testsave-${Date.now()}`;
    cpSync('.data', savedBackup, { recursive: true });
    rmSync('.data', { recursive: true, force: true });
  }
  mkdirSync('.data', { recursive: true });
});

afterAll(() => {
  if (existsSync('.data')) rmSync('.data', { recursive: true, force: true });
  if (savedBackup && existsSync(savedBackup)) {
    cpSync(savedBackup, '.data', { recursive: true });
    rmSync(savedBackup, { recursive: true, force: true });
  }
});

beforeEach(async () => {
  currentUser = { role: 'owner' };
  const { _resetForTests } = await import('../../operator/founder-os');
  _resetForTests();
});

describe('requireOwner gating', () => {
  it('401s with no user', async () => {
    currentUser = null;
    const r = makeRes();
    await viewHandler(makeReq(), r.res);
    expect(r.status).toBe(401);
  });

  it('403s an admin — admin is NOT a superset match for owner-only routes', async () => {
    currentUser = { role: 'admin' };
    const r = makeRes();
    await viewHandler(makeReq(), r.res);
    expect(r.status).toBe(403);
    expect(r.payload.error).toMatch(/owner/i);
  });

  it('403s a teacher and a student', async () => {
    for (const role of ['teacher', 'student']) {
      currentUser = { role };
      const r = makeRes();
      await viewHandler(makeReq(), r.res);
      expect(r.status).toBe(403);
    }
  });

  it('200s for owner', async () => {
    currentUser = { role: 'owner' };
    const r = makeRes();
    await viewHandler(makeReq(), r.res);
    expect(r.status).toBe(200);
  });

  it('200s for institution — roleGte treats it as above owner', async () => {
    currentUser = { role: 'institution' };
    const r = makeRes();
    await viewHandler(makeReq(), r.res);
    expect(r.status).toBe(200);
  });
});

describe('milestone CRUD via HTTP', () => {
  it('creates, reads back through the view, updates, and deletes', async () => {
    const created = makeRes();
    await createHandler(makeReq({ title: 'Ship pilot batch', target_date: '2026-10-01' }), created.res);
    expect(created.status).toBe(201);
    const id = created.payload.milestone.id;

    const view1 = makeRes();
    await viewHandler(makeReq(), view1.res);
    expect(view1.payload.complete.total).toBe(1);
    expect(view1.payload.complete.done).toBe(0);

    const updated = makeRes();
    await updateHandler(makeReq({ status: 'done' }, { id }), updated.res);
    expect(updated.status).toBe(200);
    expect(updated.payload.milestone.status).toBe('done');

    const view2 = makeRes();
    await viewHandler(makeReq(), view2.res);
    expect(view2.payload.complete.done).toBe(1);
    expect(view2.payload.complete.pct_complete).toBe(100);

    const deleted = makeRes();
    await deleteHandler(makeReq({}, { id }), deleted.res);
    expect(deleted.status).toBe(204);

    const view3 = makeRes();
    await viewHandler(makeReq(), view3.res);
    expect(view3.payload.complete.total).toBe(0);
  });

  it('400s a milestone with no title', async () => {
    const r = makeRes();
    await createHandler(makeReq({}), r.res);
    expect(r.status).toBe(400);
  });

  it('404s updating a milestone that does not exist', async () => {
    const r = makeRes();
    await updateHandler(makeReq({ status: 'done' }, { id: 'nope' }), r.res);
    expect(r.status).toBe(404);
  });

  it('404s deleting a milestone that does not exist', async () => {
    const r = makeRes();
    await deleteHandler(makeReq({}, { id: 'nope' }), r.res);
    expect(r.status).toBe(404);
  });
});

describe('settings via HTTP', () => {
  it('updates the revenue target and it is visible in the view', async () => {
    const updated = makeRes();
    await settingsHandler(makeReq({ revenue_target_minor: 100000, revenue_target_currency: 'USD' }), updated.res);
    expect(updated.status).toBe(200);
    expect(updated.payload.settings.revenue_target_minor).toBe(100000);

    const view = makeRes();
    await viewHandler(makeReq(), view.res);
    expect(view.payload.paid.target_minor).toBe(100000);
  });

  it('400s a negative revenue target', async () => {
    const r = makeRes();
    await settingsHandler(makeReq({ revenue_target_minor: -5 }), r.res);
    expect(r.status).toBe(400);
  });

  it('400s a non-positive window_days', async () => {
    const r = makeRes();
    await settingsHandler(makeReq({ window_days: 0 }), r.res);
    expect(r.status).toBe(400);
  });
});
