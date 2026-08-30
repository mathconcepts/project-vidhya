/**
 * Integration tests for the /investigate (2026-08-30) fix: gate-routes.ts's
 * legacy /api/topics + /api/problems/:topic + /api/problems/id/:id now fold
 * in the modern practice-item catalog alongside the legacy PYQ bank.
 *
 * Runs DB-less (no DATABASE_URL) against the real committed content bank —
 * exactly how the demo deploy runs, and the environment the original
 * undercount was observed in.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ServerResponse } from 'http';
import { gateRoutes } from '../gate-routes';
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
  return gateRoutes.find((r) => r.method === method && r.path === path)!;
}

describe('gate-routes.ts — modern catalog bridge', () => {
  let originalDb: string | undefined;

  beforeEach(() => {
    originalDb = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
  });
  afterEach(() => {
    if (originalDb === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDb;
  });

  it('GET /api/topics reports a linear-algebra count above the legacy-only 29', async () => {
    const route = findHandler('GET', '/api/topics');
    const res = new FakeRes();
    await route.handler(makeReq(), res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    const la = body.topics.find((t: { id: string }) => t.id === 'linear-algebra');
    expect(la).toBeDefined();
    expect(la.problemCount).toBeGreaterThan(29);
  });

  it('GET /api/problems/linear-algebra returns both legacy PYQs and modern items, none of the modern ones carrying an answer key', async () => {
    const route = findHandler('GET', '/api/problems/:topic');
    const res = new FakeRes();
    await route.handler(makeReq({ params: { topic: 'linear-algebra' } }), res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    const legacyIds = body.problems.filter((p: { id: string }) => p.id.startsWith('la-'));
    const modernIds = body.problems.filter((p: { source?: string }) => p.source === 'modern_catalog');
    expect(legacyIds.length).toBeGreaterThan(0);
    expect(modernIds.length).toBeGreaterThan(0);
    for (const p of modernIds) {
      expect(p).not.toHaveProperty('correct_answer');
      expect(p).not.toHaveProperty('options');
    }
  });

  it('GET /api/problems/id/:id resolves a modern-catalog id with no correct_answer', async () => {
    const route = findHandler('GET', '/api/problems/id/:id');
    const res = new FakeRes();
    await route.handler(makeReq({ params: { id: 'pi-matrix-operations-001' } }), res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.problem.id).toBe('pi-matrix-operations-001');
    expect(body.problem).not.toHaveProperty('correct_answer');
  });

  it('GET /api/problems/id/:id still resolves a legacy PYQ id, WITH its answer key (unchanged pre-existing contract)', async () => {
    const route = findHandler('GET', '/api/problems/id/:id');
    const res = new FakeRes();
    await route.handler(makeReq({ params: { id: 'la-001' } }), res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.problem.id).toBe('la-001');
    expect(body.problem.correct_answer).toBeTruthy();
  });

  it('GET /api/problems/id/:id 404s for a genuinely unknown id', async () => {
    const route = findHandler('GET', '/api/problems/id/:id');
    const res = new FakeRes();
    await route.handler(makeReq({ params: { id: 'nonexistent-999' } }), res as unknown as ServerResponse);

    expect(res.statusCode).toBe(404);
  });
});
