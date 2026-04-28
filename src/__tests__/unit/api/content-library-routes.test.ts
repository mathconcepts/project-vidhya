// @ts-nocheck
/**
 * Unit tests for content-library routes.
 *
 * These tests exercise the handlers directly with synthetic
 * (req, res) — no HTTP boot. Auth middleware is unmocked because
 * the existing test convention is to call the actual middleware
 * with synthetic requests.
 *
 * What's tested:
 *   - GET /concepts is public (no auth)
 *   - GET /concept/:id returns 404 for unknown
 *   - POST /concept rejects unauth (401)
 *   - POST /concept rejects student (403)
 *   - POST /concept rejects teacher when flag off (403)
 *   - POST /concept rejects source='seed'
 *   - POST /concept rejects bad concept_id (kebab-case)
 *   - POST /concept overrides client-supplied added_by
 *   - POST /concept maps source=llm correctly
 *
 * What's NOT tested here (covered elsewhere):
 *   - Auth middleware itself (existing tests)
 *   - Library store invariants (content-library.test.ts)
 *   - Live HTTP path (verified manually + smoke tests)
 *   - Flag-on teacher acceptance (env-var dependent; awkward in
 *     vitest because feature-flags reads at module-load. Verified
 *     live during the build session.)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { mkdirSync, existsSync, rmSync, cpSync, writeFileSync } from 'fs';

let savedBackup = '';

beforeAll(() => {
  if (existsSync('.data')) {
    savedBackup = `.data.libroutes-testsave-${Date.now()}`;
    cpSync('.data', savedBackup, { recursive: true });
    rmSync('.data', { recursive: true, force: true });
  }
  mkdirSync('.data', { recursive: true });
  // Ensure JWT secret is set so route auth works
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    process.env.JWT_SECRET = 'unit-test-secret-min-16-chars-please';
  }
});

afterAll(() => {
  if (existsSync('.data')) rmSync('.data', { recursive: true, force: true });
  if (savedBackup && existsSync(savedBackup)) {
    cpSync(savedBackup, '.data', { recursive: true });
    rmSync(savedBackup, { recursive: true, force: true });
  }
});

beforeEach(async () => {
  if (existsSync('.data/content-library-additions.jsonl')) {
    rmSync('.data/content-library-additions.jsonl');
  }
  // Reset user store so first-user-is-owner promotion is predictable.
  if (existsSync('.data/users.json')) {
    rmSync('.data/users.json');
  }
  const m = await import('../../../modules/content-library');
  m.reloadIndex();
});

// Synthetic ServerResponse / ParsedRequest. Each test builds its own.
function makeRes() {
  let statusCode = 200;
  let body = '';
  return {
    res: {
      writeHead(code: number, _headers: any) { statusCode = code; },
      end(b: string) { body = b; },
      get _statusCode() { return statusCode; },
      get _body() { return body; },
    },
    snapshot() {
      return {
        status: statusCode,
        json: body ? JSON.parse(body) : null,
      };
    },
  };
}

function makeReq(opts: {
  method: string;
  url: string;
  body?: any;
  params?: any;
  query?: any;
  headers?: Record<string, string>;
}) {
  return {
    method: opts.method,
    url: opts.url,
    body: opts.body,
    params: opts.params ?? {},
    query: opts.query ?? new URLSearchParams(),
    headers: opts.headers ?? {},
    rawBody: '',
    cookies: {},
  } as any;
}

async function makeAuthedReq(role: 'admin' | 'teacher' | 'student' | 'owner', opts: any = {}) {
  const { issueToken } = await import('../../../auth/jwt');
  const { upsertFromGoogle, getUserById } = await import('../../../auth/user-store');
  // Create a baseline student user
  const email = `${role}-routes-test@vidhya.local`;
  const u = upsertFromGoogle({
    google_sub: `test-${role}-routes`,
    email,
    name: `${role} test`,
    picture: null,
  });
  // Direct mutation of .data/users.json to set the role we want.
  // Avoids the setRole() actor-permission check which is overkill
  // for unit-test setup. The store re-reads the file on next access.
  if (u.role !== role) {
    const { readFileSync, writeFileSync } = await import('fs');
    const store = JSON.parse(readFileSync('.data/users.json', 'utf-8'));
    store.users[u.id].role = role;
    writeFileSync('.data/users.json', JSON.stringify(store));
  }
  const refreshed = getUserById(u.id)!;
  const token = issueToken({ user_id: refreshed.id, role: refreshed.role });
  return {
    user: refreshed,
    token,
    req: makeReq({ ...opts, headers: { authorization: `Bearer ${token}` } }),
  };
}

describe('content-library routes — read', () => {
  it('GET /concepts is public (no auth required)', async () => {
    const { contentLibraryRoutes } = await import('../../../api/content-library-routes');
    const handler = contentLibraryRoutes.find(r => r.method === 'GET' && r.path === '/api/content-library/concepts')!.handler;
    const { res, snapshot } = makeRes();
    await handler(makeReq({ method: 'GET', url: '/api/content-library/concepts' }), res as any);
    const s = snapshot();
    expect(s.status).toBe(200);
    expect(s.json.count).toBeGreaterThanOrEqual(3);
    expect(s.json.concepts.some((c: any) => c.concept_id === 'calculus-derivatives')).toBe(true);
  });

  it('GET /concept/:id is public', async () => {
    const { contentLibraryRoutes } = await import('../../../api/content-library-routes');
    const handler = contentLibraryRoutes.find(r => r.method === 'GET' && r.path === '/api/content-library/concept/:id')!.handler;
    const { res, snapshot } = makeRes();
    await handler(makeReq({ method: 'GET', url: '/api/content-library/concept/calculus-derivatives', params: { id: 'calculus-derivatives' } }), res as any);
    const s = snapshot();
    expect(s.status).toBe(200);
    expect(s.json.title).toBe('Derivative');
  });

  it('GET /concept/:unknown → 404', async () => {
    const { contentLibraryRoutes } = await import('../../../api/content-library-routes');
    const handler = contentLibraryRoutes.find(r => r.method === 'GET' && r.path === '/api/content-library/concept/:id')!.handler;
    const { res, snapshot } = makeRes();
    await handler(makeReq({ method: 'GET', url: '/api/content-library/concept/no-such-thing', params: { id: 'no-such-thing' } }), res as any);
    const s = snapshot();
    expect(s.status).toBe(404);
  });

  it('GET /concepts?source=seed filters', async () => {
    const { contentLibraryRoutes } = await import('../../../api/content-library-routes');
    const { addEntry, reloadIndex } = await import('../../../modules/content-library');
    addEntry({
      concept_id: 'route-test-add',
      title: 'Route Test',
      difficulty: 'intro',
      tags: [],
      explainer_md: 'body',
      added_by: 'unit',
      source: 'user',
    });
    reloadIndex();

    const handler = contentLibraryRoutes.find(r => r.method === 'GET' && r.path === '/api/content-library/concepts')!.handler;
    const { res, snapshot } = makeRes();
    const q = new URLSearchParams();
    q.set('source', 'seed');
    await handler(makeReq({ method: 'GET', url: '/api/content-library/concepts?source=seed', query: q }), res as any);
    const s = snapshot();
    expect(s.status).toBe(200);
    // All returned should be seed; the test add (source=user) excluded
    expect(s.json.concepts.every((c: any) => c.source === 'seed')).toBe(true);
    expect(s.json.concepts.some((c: any) => c.concept_id === 'route-test-add')).toBe(false);
  });
});

describe('content-library routes — POST authorization', () => {
  it('POST without auth → 401', async () => {
    const { contentLibraryRoutes } = await import('../../../api/content-library-routes');
    const handler = contentLibraryRoutes.find(r => r.method === 'POST')!.handler;
    const { res, snapshot } = makeRes();
    await handler(
      makeReq({
        method: 'POST',
        url: '/api/content-library/concept',
        body: { concept_id: 'foo', title: 'x', difficulty: 'intro', tags: [], explainer_md: 'b' },
      }),
      res as any,
    );
    expect(snapshot().status).toBe(401);
  });

  it('POST as student → 403', async () => {
    const { contentLibraryRoutes } = await import('../../../api/content-library-routes');
    const handler = contentLibraryRoutes.find(r => r.method === 'POST')!.handler;
    const authed = await makeAuthedReq('student', {
      method: 'POST',
      url: '/api/content-library/concept',
      body: { concept_id: 'foo', title: 'x', difficulty: 'intro', tags: [], explainer_md: 'b' },
    });
    const { res, snapshot } = makeRes();
    await handler(authed.req, res as any);
    expect(snapshot().status).toBe(403);
  });

  it('POST as teacher (flag default off) → 403 with env-var hint', async () => {
    const { contentLibraryRoutes } = await import('../../../api/content-library-routes');
    const handler = contentLibraryRoutes.find(r => r.method === 'POST')!.handler;
    const authed = await makeAuthedReq('teacher', {
      method: 'POST',
      url: '/api/content-library/concept',
      body: { concept_id: 'foo', title: 'x', difficulty: 'intro', tags: [], explainer_md: 'b' },
    });
    const { res, snapshot } = makeRes();
    await handler(authed.req, res as any);
    const s = snapshot();
    expect(s.status).toBe(403);
    expect(s.json.error).toMatch(/VIDHYA_CONTENT_LIBRARY_USER_AUTHORING/);
  });

  it('POST as admin → 201, entry persisted, added_by overridden to actor id', async () => {
    const { contentLibraryRoutes } = await import('../../../api/content-library-routes');
    const handler = contentLibraryRoutes.find(r => r.method === 'POST')!.handler;
    const authed = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-library/concept',
      body: {
        concept_id: 'admin-test-add',
        title: 'Admin Test',
        difficulty: 'intro',
        tags: ['t1'],
        explainer_md: '# body',
        added_by: 'attempted-spoof',  // should be ignored
      },
    });
    const { res, snapshot } = makeRes();
    await handler(authed.req, res as any);
    const s = snapshot();
    expect(s.status).toBe(201);
    expect(s.json.ok).toBe(true);
    expect(s.json.entry.concept_id).toBe('admin-test-add');
    expect(s.json.entry.source).toBe('user');
    // Critical: added_by is the actor id, not the spoof
    expect(s.json.entry.added_by).toBe(authed.user.id);
    expect(s.json.entry.added_by).not.toBe('attempted-spoof');
  });

  it("POST source='seed' → 400 'reserved'", async () => {
    const { contentLibraryRoutes } = await import('../../../api/content-library-routes');
    const handler = contentLibraryRoutes.find(r => r.method === 'POST')!.handler;
    const authed = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-library/concept',
      body: { concept_id: 'foo', title: 'x', difficulty: 'intro', tags: [], explainer_md: 'b', source: 'seed' },
    });
    const { res, snapshot } = makeRes();
    await handler(authed.req, res as any);
    const s = snapshot();
    expect(s.status).toBe(400);
    expect(s.json.error).toMatch(/reserved/);
  });

  it('POST with bad concept_id → 400 with kebab-case message', async () => {
    const { contentLibraryRoutes } = await import('../../../api/content-library-routes');
    const handler = contentLibraryRoutes.find(r => r.method === 'POST')!.handler;
    const authed = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-library/concept',
      body: { concept_id: 'Has Caps', title: 'x', difficulty: 'intro', tags: [], explainer_md: 'b' },
    });
    const { res, snapshot } = makeRes();
    await handler(authed.req, res as any);
    const s = snapshot();
    expect(s.status).toBe(400);
    expect(s.json.error).toMatch(/kebab-case/);
  });

  it("POST source='llm' annotates added_by as llm:provider (via actor)", async () => {
    const { contentLibraryRoutes } = await import('../../../api/content-library-routes');
    const handler = contentLibraryRoutes.find(r => r.method === 'POST')!.handler;
    const authed = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-library/concept',
      body: {
        concept_id: 'llm-test-add',
        title: 'LLM Test',
        difficulty: 'intro',
        tags: [],
        explainer_md: 'body',
        source: 'llm',
        llm_provider: 'gpt-4',
      },
    });
    const { res, snapshot } = makeRes();
    await handler(authed.req, res as any);
    const s = snapshot();
    expect(s.status).toBe(201);
    expect(s.json.entry.source).toBe('llm');
    expect(s.json.entry.added_by).toBe(`llm:gpt-4 (via ${authed.user.id})`);
  });
});
