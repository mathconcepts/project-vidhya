/**
 * Tests for GET /api/teaching/roster (src/api/teaching-routes.ts).
 *
 * The coverage page calls this on every load. Before it existed the call
 * 404'd and the page rendered an empty roster with nothing indicating
 * failure — the silent-null shape this branch has been hunting. These lock
 * the three things that decide whether the page is right or quietly wrong:
 * who sees whom, that a student is answered rather than rejected, and that
 * contact details never ride along with identity.
 *
 * Auth wiring itself is covered by the middleware's own tests; requireAuth
 * and the user store are injected here so the endpoint's own contract is
 * what is under test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ServerResponse } from 'http';

const mockRequireAuth = vi.fn();
vi.mock('../../auth/middleware', () => ({
  requireAuth: (...args: any[]) => mockRequireAuth(...args),
  requireRole: () => vi.fn(),
  requireAnyRole: () => vi.fn(),
}));

const mockListUsers = vi.fn();
const mockGetUserById = vi.fn();
vi.mock('../../auth/user-store', () => ({
  listUsers: (...a: any[]) => mockListUsers(...a),
  getUserById: (...a: any[]) => mockGetUserById(...a),
  pushReviewToStudent: vi.fn(),
  dismissPushedReview: vi.fn(),
  listPushedReviews: vi.fn(() => []),
}));

const { teachingRoutes } = await import('../teaching-routes');

const handler = teachingRoutes.find(
  (r: any) => r.method === 'GET' && r.path === '/api/teaching/roster',
)!.handler;

function makeRes() {
  const captured: any = { status: 200, payload: null };
  const res: any = {
    setHeader: () => {},
    writeHead: (s: number) => {
      captured.status = s;
    },
    end: (d?: string) => {
      if (d) {
        try {
          captured.payload = JSON.parse(d);
        } catch {
          captured.payload = d;
        }
      }
    },
    write: () => {},
  };
  return {
    res: res as ServerResponse,
    get status() {
      return captured.status;
    },
    get payload() {
      return captured.payload;
    },
  };
}

const req = { pathname: '/api/teaching/roster', params: {}, query: new URLSearchParams(), headers: {} } as any;

function user(id: string, role: string, extra: Record<string, unknown> = {}) {
  return { id, role, name: `${id} name`, email: `${id}@example.com`, teacher_of: [], ...extra };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListUsers.mockReturnValue([]);
  mockGetUserById.mockReturnValue(null);
});

describe('GET /api/teaching/roster', () => {
  it('gives an admin every student, and only students', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'a1' } });
    mockGetUserById.mockImplementation((id: string) => (id === 'a1' ? user('a1', 'admin') : null));
    mockListUsers.mockReturnValue([
      user('s1', 'student'),
      user('t1', 'teacher'),
      user('s2', 'student'),
    ]);

    const r = makeRes();
    await handler(req, r.res);

    expect(r.status).toBe(200);
    expect(r.payload.students.map((s: any) => s.id)).toEqual(['s1', 's2']);
  });

  it('treats owner as admin', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'o1' } });
    mockGetUserById.mockImplementation((id: string) => (id === 'o1' ? user('o1', 'owner') : null));
    mockListUsers.mockReturnValue([user('s1', 'student')]);

    const r = makeRes();
    await handler(req, r.res);

    expect(r.payload.students).toHaveLength(1);
  });

  it('gives a teacher only their own students', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 't1' } });
    mockGetUserById.mockImplementation((id: string) => {
      if (id === 't1') return user('t1', 'teacher', { teacher_of: ['s1', 's9'] });
      if (id === 's1') return user('s1', 'student');
      return null; // s9 was deleted
    });

    const r = makeRes();
    await handler(req, r.res);

    // A dangling teacher_of id is dropped rather than emitted as a null row —
    // the page renders a short roster instead of crashing on `.name`.
    expect(r.payload.students).toEqual([{ id: 's1', name: 's1 name' }]);
    expect(mockListUsers).not.toHaveBeenCalled();
  });

  it('answers a student with an empty roster, not a 403', async () => {
    // A student landing on a teacher surface is a routing accident, not an
    // attack. A 403 would surface as an error banner mid-demo; an empty list
    // is both true and unalarming.
    mockRequireAuth.mockResolvedValue({ user: { id: 's1' } });
    mockGetUserById.mockImplementation((id: string) => (id === 's1' ? user('s1', 'student') : null));

    const r = makeRes();
    await handler(req, r.res);

    expect(r.status).toBe(200);
    expect(r.payload).toEqual({ students: [] });
  });

  it('answers an authenticated caller with no stored profile with an empty roster', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'ghost' } });
    mockGetUserById.mockReturnValue(null);

    const r = makeRes();
    await handler(req, r.res);

    expect(r.status).toBe(200);
    expect(r.payload).toEqual({ students: [] });
  });

  it('never emits an email address', async () => {
    // The cohort surface's PII invariant treats a leaked contact detail as a
    // defect. The page needs identity, not a way to contact a minor.
    mockRequireAuth.mockResolvedValue({ user: { id: 'a1' } });
    mockGetUserById.mockImplementation((id: string) => (id === 'a1' ? user('a1', 'admin') : null));
    mockListUsers.mockReturnValue([user('s1', 'student')]);

    const r = makeRes();
    await handler(req, r.res);

    expect(JSON.stringify(r.payload)).not.toContain('@example.com');
    expect(Object.keys(r.payload.students[0]).sort()).toEqual(['id', 'name']);
  });

  it('writes nothing when the caller is unauthenticated', async () => {
    // requireAuth has already answered 401; the handler must not continue and
    // must not consult the user store.
    mockRequireAuth.mockResolvedValue(null);

    const r = makeRes();
    await handler(req, r.res);

    expect(r.payload).toBeNull();
    expect(mockGetUserById).not.toHaveBeenCalled();
  });
});
