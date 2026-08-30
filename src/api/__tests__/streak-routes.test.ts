/**
 * Tests for src/api/streak-routes.ts.
 *
 * Regression: getPool() used to throw '[streak] DATABASE_URL not configured'
 * when DATABASE_URL was unset, which server.ts's dispatcher turned into an
 * uncaught 500 on every GET/POST /api/streak/:id — i.e. on every page load
 * of CompoundingCard, in the exact DB-less mode the Render demo runs in.
 * Found by /qa on 2026-08-30. The rest of the platform degrades honestly
 * when DB-less (see e.g. readiness-routes.ts); this endpoint now matches
 * that contract instead of throwing.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ServerResponse } from 'http';
import { streakRoutes } from '../streak-routes';
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
  return streakRoutes.find((r) => r.method === method && r.path === path)!;
}

describe('streak-routes — DB-less degrade', () => {
  let originalDb: string | undefined;

  beforeEach(() => {
    originalDb = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
  });
  afterEach(() => {
    if (originalDb === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDb;
  });

  it('GET /api/streak/:id returns a zeroed 200, not a 500, when DB-less', async () => {
    const route = findHandler('GET', '/api/streak/:id');
    const res = new FakeRes();
    await route.handler(makeReq({ params: { id: 'sess-1' } }), res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      isActiveToday: false,
    });
  });

  it('POST /api/streak/:id no-ops with a 200, not a 500, when DB-less', async () => {
    const route = findHandler('POST', '/api/streak/:id');
    const res = new FakeRes();
    await route.handler(makeReq({ params: { id: 'sess-1' } }), res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.recorded).toBe(false);
  });
});
