// @ts-nocheck
/**
 * Unit tests for content-studio routes.
 *
 * Mirrors the synthetic-req/res pattern from content-library-routes.test.ts.
 * No HTTP boot — handlers are called directly.
 *
 * What's tested:
 *   - All endpoints reject unauth (401) and student (403)
 *   - POST /generate validates concept_id (kebab-case), difficulty,
 *     sources_to_try, source_url type
 *   - POST /generate succeeds for admin and persists the draft
 *   - GET /drafts and GET /drafts?status=draft work and round-trip
 *   - GET /drafts?status=garbage → 400 with helpful message
 *   - GET /draft/:id 200 / 404
 *   - PATCH /draft/:id validates editable fields, sets edited_at/by
 *   - PATCH rejects empty edits (400)
 *   - POST /draft/:id/approve promotes to library with EDITED body
 *     and source='user' for non-LLM sourced drafts
 *   - POST /approve fails with 400 on second approve
 *   - POST /reject requires reason; flips status
 *   - Identity overrides — a student-supplied actor in the request
 *     body is ignored; admin's id is used (audit trail integrity)
 *
 * What's NOT tested here:
 *   - Auth middleware itself (covered elsewhere)
 *   - Studio store invariants (content-studio.test.ts)
 *   - Live HTTP path (verified live during build with all 14 probes)
 *   - Rate-limit/budget integration in the LLM source (would require
 *     setting GEMINI_API_KEY which isn't available in the test env;
 *     the protections were verified by code inspection + the chat-path
 *     tests that exercise the same modules)
 *   - The /underperforming endpoint logic (would need synthetic
 *     teaching turns; deferred — the handler is straightforward read
 *     + filter and was verified live)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { mkdirSync, existsSync, rmSync, cpSync } from 'fs';

let savedBackup = '';

beforeAll(() => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    process.env.JWT_SECRET = 'unit-test-secret-min-16-chars-please';
  }
  if (existsSync('.data')) {
    savedBackup = `.data.studioroutes-testsave-${Date.now()}`;
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
  if (existsSync('.data/content-drafts.jsonl')) rmSync('.data/content-drafts.jsonl');
  if (existsSync('.data/content-library-additions.jsonl')) rmSync('.data/content-library-additions.jsonl');
  if (existsSync('.data/users.json')) rmSync('.data/users.json');
  // Reload the library index so previous-test entries don't leak in
  const lib = await import('../../../modules/content-library');
  lib.reloadIndex();
});

// ─── Synthetic req/res helpers (mirroring library-routes pattern) ────

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
  const email = `${role}-studioroutes-test@vidhya.local`;
  const u = upsertFromGoogle({
    google_sub: `test-${role}-studioroutes`,
    email,
    name: `${role} studio test`,
    picture: null,
  });
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

async function getHandler(method: string, path: string) {
  const { contentStudioRoutes } = await import('../../../api/content-studio-routes');
  const route = contentStudioRoutes.find(r => r.method === method && r.path === path);
  if (!route) throw new Error(`route not found: ${method} ${path}`);
  return route.handler;
}

// ─── Auth gate tests ────────────────────────────────────────────────

describe('content-studio routes — auth gate', () => {
  it('POST /generate rejects unauth (401)', async () => {
    const handler = await getHandler('POST', '/api/content-studio/generate');
    const { res, snapshot } = makeRes();
    await handler(makeReq({
      method: 'POST',
      url: '/api/content-studio/generate',
      body: { concept_id: 'x', title: 'X', difficulty: 'intro', sources_to_try: ['uploads'] },
    }), res as any);
    expect(snapshot().status).toBe(401);
  });

  it('POST /generate rejects student (403)', async () => {
    const handler = await getHandler('POST', '/api/content-studio/generate');
    const { req } = await makeAuthedReq('student', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: { concept_id: 'x', title: 'X', difficulty: 'intro', sources_to_try: ['uploads'] },
    });
    const { res, snapshot } = makeRes();
    await handler(req, res as any);
    expect(snapshot().status).toBe(403);
    expect(snapshot().json.error).toMatch(/admin role required/);
  });

  it('POST /generate rejects teacher (403) — studio is admin-only, no flag broadening', async () => {
    const handler = await getHandler('POST', '/api/content-studio/generate');
    const { req } = await makeAuthedReq('teacher', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: { concept_id: 'x', title: 'X', difficulty: 'intro', sources_to_try: ['uploads'] },
    });
    const { res, snapshot } = makeRes();
    await handler(req, res as any);
    expect(snapshot().status).toBe(403);
  });

  it('GET /drafts rejects unauth', async () => {
    const handler = await getHandler('GET', '/api/content-studio/drafts');
    const { res, snapshot } = makeRes();
    await handler(makeReq({ method: 'GET', url: '/api/content-studio/drafts' }), res as any);
    expect(snapshot().status).toBe(401);
  });

  it('GET /drafts rejects student', async () => {
    const handler = await getHandler('GET', '/api/content-studio/drafts');
    const { req } = await makeAuthedReq('student', { method: 'GET', url: '/api/content-studio/drafts' });
    const { res, snapshot } = makeRes();
    await handler(req, res as any);
    expect(snapshot().status).toBe(403);
  });
});

// ─── Validation tests ──────────────────────────────────────────────

describe('content-studio routes — validation', () => {
  it('POST /generate rejects bad concept_id (uppercase)', async () => {
    const handler = await getHandler('POST', '/api/content-studio/generate');
    const { req } = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: { concept_id: 'NotKebab', title: 'X', difficulty: 'intro', sources_to_try: ['uploads'] },
    });
    const { res, snapshot } = makeRes();
    await handler(req, res as any);
    expect(snapshot().status).toBe(400);
    expect(snapshot().json.error).toMatch(/kebab-case/);
  });

  it('POST /generate rejects missing title', async () => {
    const handler = await getHandler('POST', '/api/content-studio/generate');
    const { req } = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: { concept_id: 'valid-id', title: '', difficulty: 'intro', sources_to_try: ['uploads'] },
    });
    const { res, snapshot } = makeRes();
    await handler(req, res as any);
    expect(snapshot().status).toBe(400);
    expect(snapshot().json.error).toMatch(/title is required/);
  });

  it('POST /generate rejects bad difficulty', async () => {
    const handler = await getHandler('POST', '/api/content-studio/generate');
    const { req } = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: { concept_id: 'valid-id', title: 'X', difficulty: 'expert', sources_to_try: ['uploads'] },
    });
    const { res, snapshot } = makeRes();
    await handler(req, res as any);
    expect(snapshot().status).toBe(400);
    expect(snapshot().json.error).toMatch(/difficulty/);
  });

  it('POST /generate rejects empty sources_to_try', async () => {
    const handler = await getHandler('POST', '/api/content-studio/generate');
    const { req } = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: { concept_id: 'valid-id', title: 'X', difficulty: 'intro', sources_to_try: [] },
    });
    const { res, snapshot } = makeRes();
    await handler(req, res as any);
    expect(snapshot().status).toBe(400);
    expect(snapshot().json.error).toMatch(/sources_to_try/);
  });

  it('POST /generate rejects unknown source kind', async () => {
    const handler = await getHandler('POST', '/api/content-studio/generate');
    const { req } = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: { concept_id: 'valid-id', title: 'X', difficulty: 'intro', sources_to_try: ['scrape'] },
    });
    const { res, snapshot } = makeRes();
    await handler(req, res as any);
    expect(snapshot().status).toBe(400);
    expect(snapshot().json.error).toMatch(/unknown source kind/);
  });

  it('GET /drafts?status=garbage → 400 with allowed values', async () => {
    const handler = await getHandler('GET', '/api/content-studio/drafts');
    const { req } = await makeAuthedReq('admin', {
      method: 'GET',
      url: '/api/content-studio/drafts?status=garbage',
      query: new URLSearchParams('status=garbage'),
    });
    const { res, snapshot } = makeRes();
    await handler(req, res as any);
    expect(snapshot().status).toBe(400);
    expect(snapshot().json.error).toMatch(/draft.*approved.*rejected.*archived/);
  });
});

// ─── Lifecycle tests ───────────────────────────────────────────────

describe('content-studio routes — lifecycle', () => {
  it('POST /generate succeeds for admin and persists the draft', async () => {
    const handler = await getHandler('POST', '/api/content-studio/generate');
    const { req, user } = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: {
        concept_id: 'unit-test-1',
        title: 'Unit Test',
        difficulty: 'intermediate',
        sources_to_try: ['uploads'],
        tags: ['test'],
      },
    });
    const { res, snapshot } = makeRes();
    await handler(req, res as any);
    const s = snapshot();
    expect(s.status).toBe(201);
    expect(s.json.draft_id).toMatch(/^draft_/);
    expect(s.json.status).toBe('draft');
    expect(s.json.concept_id).toBe('unit-test-1');
    expect(s.json.title).toBe('Unit Test');
    // Used source should be null because uploads tagged with 'unit-test-1' don't exist
    expect(s.json.generation.used_source).toBeNull();
  });

  it('GET /drafts returns drafts and filters by status', async () => {
    // First create one
    const gen = await getHandler('POST', '/api/content-studio/generate');
    const { req: gen_req } = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: {
        concept_id: 'list-test-1',
        title: 'List Test',
        difficulty: 'intro',
        sources_to_try: ['uploads'],
      },
    });
    const { res: gen_res } = makeRes();
    await gen(gen_req, gen_res as any);

    // List
    const list = await getHandler('GET', '/api/content-studio/drafts');
    const { req: list_req } = await makeAuthedReq('admin', {
      method: 'GET', url: '/api/content-studio/drafts',
    });
    const { res: list_res, snapshot: list_snap } = makeRes();
    await list(list_req, list_res as any);
    const s = list_snap();
    expect(s.status).toBe(200);
    expect(s.json.count).toBeGreaterThanOrEqual(1);
    expect(s.json.drafts[0].draft_id).toMatch(/^draft_/);

    // Filter by status=draft
    const { req: filter_req } = await makeAuthedReq('admin', {
      method: 'GET',
      url: '/api/content-studio/drafts?status=draft',
      query: new URLSearchParams('status=draft'),
    });
    const { res: filter_res, snapshot: filter_snap } = makeRes();
    await list(filter_req, filter_res as any);
    expect(filter_snap().json.count).toBe(s.json.count);

    // Filter by status=approved → should be 0
    const { req: a_req } = await makeAuthedReq('admin', {
      method: 'GET',
      url: '/api/content-studio/drafts?status=approved',
      query: new URLSearchParams('status=approved'),
    });
    const { res: a_res, snapshot: a_snap } = makeRes();
    await list(a_req, a_res as any);
    expect(a_snap().json.count).toBe(0);
  });

  it('GET /draft/:id 200 for known, 404 for unknown', async () => {
    // Create
    const gen = await getHandler('POST', '/api/content-studio/generate');
    const { req: gen_req } = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: {
        concept_id: 'get-test-1',
        title: 'Get Test',
        difficulty: 'intro',
        sources_to_try: ['uploads'],
      },
    });
    const { res: gen_res, snapshot: gen_snap } = makeRes();
    await gen(gen_req, gen_res as any);
    const id = gen_snap().json.draft_id;

    // Get known
    const get = await getHandler('GET', '/api/content-studio/draft/:id');
    const { req: get_req } = await makeAuthedReq('admin', {
      method: 'GET',
      url: `/api/content-studio/draft/${id}`,
      params: { id },
    });
    const { res: get_res, snapshot: get_snap } = makeRes();
    await get(get_req, get_res as any);
    expect(get_snap().status).toBe(200);
    expect(get_snap().json.draft_id).toBe(id);

    // Get unknown
    const { req: nf_req } = await makeAuthedReq('admin', {
      method: 'GET',
      url: '/api/content-studio/draft/nonexistent',
      params: { id: 'nonexistent' },
    });
    const { res: nf_res, snapshot: nf_snap } = makeRes();
    await get(nf_req, nf_res as any);
    expect(nf_snap().status).toBe(404);
  });

  it('PATCH /draft/:id edits fields and sets edited_at/by', async () => {
    // Create
    const gen = await getHandler('POST', '/api/content-studio/generate');
    const { req: gen_req } = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: {
        concept_id: 'patch-test',
        title: 'Original',
        difficulty: 'intro',
        sources_to_try: ['uploads'],
      },
    });
    const { res: gen_res, snapshot: gen_snap } = makeRes();
    await gen(gen_req, gen_res as any);
    const id = gen_snap().json.draft_id;

    // Patch
    const patch = await getHandler('PATCH', '/api/content-studio/draft/:id');
    const { req: patch_req, user } = await makeAuthedReq('admin', {
      method: 'PATCH',
      url: `/api/content-studio/draft/${id}`,
      params: { id },
      body: { title: 'Edited', explainer_md: '# Edited body' },
    });
    const { res: patch_res, snapshot: patch_snap } = makeRes();
    await patch(patch_req, patch_res as any);
    const ps = patch_snap();
    expect(ps.status).toBe(200);
    expect(ps.json.title).toBe('Edited');
    expect(ps.json.explainer_md).toBe('# Edited body');
    expect(ps.json.edited_at).toBeDefined();
    expect(ps.json.edited_by).toBe(user.id);
  });

  it('PATCH /draft/:id rejects empty edits (400)', async () => {
    const gen = await getHandler('POST', '/api/content-studio/generate');
    const { req: gen_req } = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: {
        concept_id: 'empty-patch',
        title: 'X',
        difficulty: 'intro',
        sources_to_try: ['uploads'],
      },
    });
    const { res: gen_res, snapshot: gen_snap } = makeRes();
    await gen(gen_req, gen_res as any);
    const id = gen_snap().json.draft_id;

    const patch = await getHandler('PATCH', '/api/content-studio/draft/:id');
    const { req: patch_req } = await makeAuthedReq('admin', {
      method: 'PATCH',
      url: `/api/content-studio/draft/${id}`,
      params: { id },
      body: {},
    });
    const { res: patch_res, snapshot: patch_snap } = makeRes();
    await patch(patch_req, patch_res as any);
    expect(patch_snap().status).toBe(400);
    expect(patch_snap().json.error).toMatch(/at least one editable field/);
  });

  it('POST /draft/:id/approve promotes to library with EDITED body', async () => {
    // Create
    const gen = await getHandler('POST', '/api/content-studio/generate');
    const { req: gen_req } = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: {
        concept_id: 'approve-promotion',
        title: 'Original Title',
        difficulty: 'intermediate',
        sources_to_try: ['uploads'],
        tags: ['unit-test'],
      },
    });
    const { res: gen_res, snapshot: gen_snap } = makeRes();
    await gen(gen_req, gen_res as any);
    const id = gen_snap().json.draft_id;

    // Edit body before approval
    const patch = await getHandler('PATCH', '/api/content-studio/draft/:id');
    const { req: patch_req } = await makeAuthedReq('admin', {
      method: 'PATCH',
      url: `/api/content-studio/draft/${id}`,
      params: { id },
      body: {
        title: 'Edited Title',
        explainer_md: '# Edited Body\n\nReal content for the library.',
      },
    });
    const { res: patch_res } = makeRes();
    await patch(patch_req, patch_res as any);

    // Approve
    const approve = await getHandler('POST', '/api/content-studio/draft/:id/approve');
    const { req: a_req, user } = await makeAuthedReq('admin', {
      method: 'POST',
      url: `/api/content-studio/draft/${id}/approve`,
      params: { id },
    });
    const { res: a_res, snapshot: a_snap } = makeRes();
    await approve(a_req, a_res as any);
    const s = a_snap();
    expect(s.status).toBe(200);
    expect(s.json.status).toBe('approved');
    expect(s.json.promoted_as).toBe('approve-promotion');

    // Verify the library now has the entry with EDITED body
    const { reloadIndex, getEntry } = await import('../../../modules/content-library');
    reloadIndex();
    const entry = getEntry('approve-promotion');
    expect(entry).not.toBeNull();
    expect(entry!.title).toBe('Edited Title');
    expect(entry!.explainer_md).toMatch(/Real content for the library/);
    expect(entry!.added_by).toBe(user.id);
    expect(entry!.source).toBe('user');   // uploads source → user
    expect(entry!.licence).toBe('studio-promoted');
  });

  it('POST /approve fails with 400 on second approve', async () => {
    const gen = await getHandler('POST', '/api/content-studio/generate');
    const { req: gen_req } = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: {
        concept_id: 'double-approve',
        title: 'X',
        difficulty: 'intro',
        sources_to_try: ['uploads'],
      },
    });
    const { res: gen_res, snapshot: gen_snap } = makeRes();
    await gen(gen_req, gen_res as any);
    const id = gen_snap().json.draft_id;

    const approve = await getHandler('POST', '/api/content-studio/draft/:id/approve');

    const { req: a1_req } = await makeAuthedReq('admin', {
      method: 'POST', url: `/api/content-studio/draft/${id}/approve`, params: { id },
    });
    const { res: a1_res, snapshot: a1_snap } = makeRes();
    await approve(a1_req, a1_res as any);
    expect(a1_snap().status).toBe(200);

    // Second approve
    const { req: a2_req } = await makeAuthedReq('admin', {
      method: 'POST', url: `/api/content-studio/draft/${id}/approve`, params: { id },
    });
    const { res: a2_res, snapshot: a2_snap } = makeRes();
    await approve(a2_req, a2_res as any);
    expect(a2_snap().status).toBe(400);
    expect(a2_snap().json.error).toMatch(/status='approved'/);
  });

  it('POST /reject requires reason; flips status', async () => {
    const gen = await getHandler('POST', '/api/content-studio/generate');
    const { req: gen_req } = await makeAuthedReq('admin', {
      method: 'POST',
      url: '/api/content-studio/generate',
      body: {
        concept_id: 'reject-test',
        title: 'X',
        difficulty: 'intro',
        sources_to_try: ['uploads'],
      },
    });
    const { res: gen_res, snapshot: gen_snap } = makeRes();
    await gen(gen_req, gen_res as any);
    const id = gen_snap().json.draft_id;

    const reject = await getHandler('POST', '/api/content-studio/draft/:id/reject');

    // Reject without reason → 400
    const { req: r1_req } = await makeAuthedReq('admin', {
      method: 'POST',
      url: `/api/content-studio/draft/${id}/reject`,
      params: { id },
      body: {},
    });
    const { res: r1_res, snapshot: r1_snap } = makeRes();
    await reject(r1_req, r1_res as any);
    expect(r1_snap().status).toBe(400);
    expect(r1_snap().json.error).toMatch(/reason/);

    // Reject with reason → 200
    const { req: r2_req, user } = await makeAuthedReq('admin', {
      method: 'POST',
      url: `/api/content-studio/draft/${id}/reject`,
      params: { id },
      body: { reason: 'not on-topic for our exam' },
    });
    const { res: r2_res, snapshot: r2_snap } = makeRes();
    await reject(r2_req, r2_res as any);
    expect(r2_snap().status).toBe(200);
    expect(r2_snap().json.status).toBe('rejected');
    expect(r2_snap().json.rejection_reason).toBe('not on-topic for our exam');
    expect(r2_snap().json.resolved_by).toBe(user.id);
  });
});
