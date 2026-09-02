/**
 * studymate-routes — session-ownership enforcement on /answer and /complete.
 *
 * Found by /ship's review army (security specialist, 2026-09-02):
 * `studymateId` reaches these handlers from a URL path segment the client
 * fully controls. Before this fix, neither handler verified the caller's
 * anonymous session_id actually owned that studymateId, so any caller who
 * knew (or guessed) another session's studymateId could record an answer,
 * or complete the session, on someone else's behalf. Pre-existing on the
 * Postgres backend; the diff at 94636ad made the write path newly
 * *effective* on the flat-file (DB-less demo) backend too, where a raw
 * pool.query previously no-op'd.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { ParsedRequest } from '../../lib/route-helpers';

let testDir: string;
let cwdSpy: ReturnType<typeof vi.spyOn>;
const ORIGINAL_DB_URL = process.env.DATABASE_URL;

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

describe('studymate-routes — ownership enforcement (flat-file backend)', () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'studymate-ownership-'));
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(testDir);
    vi.resetModules();
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    fs.rmSync(testDir, { recursive: true, force: true });
    if (ORIGINAL_DB_URL === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = ORIGINAL_DB_URL;
    vi.resetModules();
  });

  async function seedSession(ownerSessionId: string): Promise<string> {
    const { getSessionStore, _resetSessionStoreForTests } = await import('../../sessions/session-store');
    _resetSessionStoreForTests();
    const store = getSessionStore();
    return store.createSession(ownerSessionId, 'gate-ma', 'daily', [{
      problem_id: 'p1', concept_id: 'c1', topic: 't', difficulty: 0.5,
      question: 'q', expected_answer: 'a', source: 's',
    }]);
  }

  async function findHandler(method: string, path: string) {
    const { studymateRoutes } = await import('../studymate-routes');
    return studymateRoutes.find((r) => r.method === method && r.path === path)!;
  }

  it('POST /answer succeeds (200) when session_id matches the session owner', async () => {
    const studymateId = await seedSession('owner-session');
    const route = await findHandler('POST', '/api/studymate/sessions/:id/answer');
    const res = new FakeRes();
    await route.handler(makeReq({
      params: { id: studymateId },
      headers: { 'x-session-id': 'owner-session' },
      body: { problem_id: 'p1', user_answer: 'a', was_correct: true },
    }), res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);
  });

  it('POST /answer is refused (403) when session_id does NOT own the studymate session', async () => {
    const studymateId = await seedSession('owner-session');
    const route = await findHandler('POST', '/api/studymate/sessions/:id/answer');
    const res = new FakeRes();
    await route.handler(makeReq({
      params: { id: studymateId },
      headers: { 'x-session-id': 'attacker-session' },
      body: { problem_id: 'p1', user_answer: 'a', was_correct: true },
    }), res as unknown as ServerResponse);

    expect(res.statusCode).toBe(403);
  });

  it('POST /answer is refused (400) when session_id is missing entirely', async () => {
    const studymateId = await seedSession('owner-session');
    const route = await findHandler('POST', '/api/studymate/sessions/:id/answer');
    const res = new FakeRes();
    await route.handler(makeReq({
      params: { id: studymateId },
      body: { problem_id: 'p1', user_answer: 'a', was_correct: true },
    }), res as unknown as ServerResponse);

    expect(res.statusCode).toBe(400);
  });

  it('POST /complete succeeds (200) when session_id matches the session owner', async () => {
    const studymateId = await seedSession('owner-session');
    const route = await findHandler('POST', '/api/studymate/sessions/:id/complete');
    const res = new FakeRes();
    await route.handler(makeReq({
      params: { id: studymateId },
      headers: { 'x-session-id': 'owner-session' },
    }), res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);
  });

  it('POST /complete is refused (403) when session_id does NOT own the studymate session', async () => {
    const studymateId = await seedSession('owner-session');
    const route = await findHandler('POST', '/api/studymate/sessions/:id/complete');
    const res = new FakeRes();
    await route.handler(makeReq({
      params: { id: studymateId },
      headers: { 'x-session-id': 'attacker-session' },
    }), res as unknown as ServerResponse);

    expect(res.statusCode).toBe(403);
  });

  it('POST /complete is refused (403) when the studymateId does not exist at all', async () => {
    await seedSession('owner-session'); // establishes the flat-file store, unused otherwise
    const route = await findHandler('POST', '/api/studymate/sessions/:id/complete');
    const res = new FakeRes();
    await route.handler(makeReq({
      params: { id: 'sm-does-not-exist' },
      headers: { 'x-session-id': 'owner-session' },
    }), res as unknown as ServerResponse);

    expect(res.statusCode).toBe(403);
  });
});
