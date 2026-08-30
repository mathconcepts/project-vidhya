// @ts-nocheck
/**
 * Tests for src/api/admin-content-spec-routes.ts — the read-only surface
 * over docs/content-spec/'s founder-authored per-subtopic content
 * generation specification.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerResponse } from 'http';

const authMock = vi.hoisted(() => ({ requireRole: vi.fn() }));
vi.mock('../auth-middleware', () => authMock);

const { adminContentSpecRoutes } = await import('../admin-content-spec-routes');

const listHandler = adminContentSpecRoutes.find(
  (r) => r.method === 'GET' && r.path === '/api/admin/content-spec/atomic-topics',
)!.handler;
const getHandler = adminContentSpecRoutes.find(
  (r) => r.method === 'GET' && r.path === '/api/admin/content-spec/atomic-topics/:atomicId',
)!.handler;

function makeReq(params: Record<string, string> = {}, query: Record<string, string> = {}) {
  return { pathname: '/', query: new URLSearchParams(query), params, body: {}, headers: {} } as any;
}

// status/payload are getters — read AFTER the handler runs, never destructure up front.
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

beforeEach(() => {
  authMock.requireRole.mockReset();
});

describe('admin-content-spec-routes', () => {
  it('requires admin auth on list — a denied requireRole (already wrote its own status) short-circuits', async () => {
    authMock.requireRole.mockResolvedValue(null);
    const r = makeRes();
    await listHandler(makeReq(), r.res);
    expect(r.payload).toBeNull();
  });

  it('lists all 116 atomic topics with a domain index', async () => {
    authMock.requireRole.mockResolvedValue({ userId: 'admin-1', role: 'admin' });
    const r = makeRes();
    await listHandler(makeReq(), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.count).toBe(116);
    expect(r.payload.domains).toContain('Linear Algebra');
    expect(r.payload.topics[0]).toHaveProperty('atomic_id');
    expect(r.payload.topics[0]).toHaveProperty('template_family');
    // List view is a projection — never the full base_content_contract prose.
    expect(r.payload.topics[0]).not.toHaveProperty('base_content_contract');
  });

  it('filters the list by domain', async () => {
    authMock.requireRole.mockResolvedValue({ userId: 'admin-1', role: 'admin' });
    const r = makeRes();
    await listHandler(makeReq({}, { domain: 'Linear Algebra' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.count).toBeGreaterThan(0);
    expect(r.payload.topics.every((t: any) => t.domain === 'Linear Algebra')).toBe(true);
  });

  it('gets a single atomic topic by id, with full structure + generation spec', async () => {
    authMock.requireRole.mockResolvedValue({ userId: 'admin-1', role: 'admin' });
    const r = makeRes();
    await getHandler(makeReq({ atomicId: 'LA-06' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.atomic_id).toBe('LA-06');
    expect(r.payload.structure.template_family).toBe('eigen');
    expect(r.payload.generation.hooks.length).toBeGreaterThan(0);
  });

  it('404s on an unknown atomic_id', async () => {
    authMock.requireRole.mockResolvedValue({ userId: 'admin-1', role: 'admin' });
    const r = makeRes();
    await getHandler(makeReq({ atomicId: 'ZZ-99' }), r.res);
    expect(r.status).toBe(404);
  });
});
