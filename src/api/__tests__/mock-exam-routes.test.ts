/**
 * Tests for src/api/mock-exam-routes.ts — T22 (ENG-D3), plus the ownership-
 * binding follow-up fix.
 *
 * Everything is injected through setMockExamDepsForTests() — no Postgres,
 * no JWT. requireRole is mocked. Covers: the leak discipline on
 * GET .../mock-exam/:sessionId (never an answer key, pre-submission),
 * server-side grading via the deterministic scorer for BOTH pyq- and
 * generated-sourced questions, honest handling of ungraded questions,
 * lateness, and double-submit idempotency.
 *
 * Ownership binding (the real shape, NOT sessionId===user.userId): a mock
 * exam's `owner_user_id` is the authenticated caller that generated it.
 * `session_id` is a SEPARATE mastery-calibration key that legitimately
 * differs from the caller's own id (MockExamPage.tsx sources it from the
 * anonymous useSession() localStorage UUID) — so "sessionId !== userId for
 * the SAME student" must work end-to-end, and the real IDOR is "a
 * DIFFERENT student reaches an exam/session they don't own", never a
 * mismatch between sessionId and userId by itself.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerResponse } from 'http';
import type { MockExamRow } from '../../gbrain/mock-exam-store';
import { compiledAssessmentContract } from '../../exams/assessment-contract-loader';
import { snapshotForCreation } from '../../scoring/contract-grading';

const mockRequireRole = vi.fn();
vi.mock('../auth-middleware', () => ({
  requireRole: (...args: any[]) => mockRequireRole(...args),
}));

// Adversarial-review fix test seam: gradeMockExam isn't part of
// MockExamDeps (it's imported directly, not injected), so simulating a
// grading THROW needs the module itself mocked — wrapping the real
// implementation in a vi.fn() lets most tests run unmodified (they call
// straight through) while a couple of tests below override it with
// `mockRejectedValueOnce` to exercise the claim-revert path.
vi.mock('../../gbrain/mock-exam-grading', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../gbrain/mock-exam-grading')>();
  return { ...actual, gradeMockExam: vi.fn(actual.gradeMockExam) };
});

const { mockExamRoutes, setMockExamDepsForTests } = await import('../mock-exam-routes');
const { gradeMockExam } = await import('../../gbrain/mock-exam-grading');

const generateHandler = mockExamRoutes.find((r) => r.method === 'GET' && r.path === '/api/gbrain/mock-exam/:sessionId')!.handler;
const submitHandler = mockExamRoutes.find((r) => r.method === 'POST' && r.path === '/api/gbrain/mock-exam/:id/submit')!.handler;
const resultHandler = mockExamRoutes.find((r) => r.method === 'GET' && r.path === '/api/gbrain/mock-exam/:id/result')!.handler;
const topicsHandler = mockExamRoutes.find((r) => r.method === 'GET' && r.path === '/api/gbrain/mock-exam/topics')!.handler;

function makeReq(body: unknown, params: Record<string, string> = {}, query: Record<string, string> = {}) {
  return { pathname: '/', query: new URLSearchParams(query), params, body, headers: {} } as any;
}

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

const PYQ_Q = {
  id: 'pyq-1', topic: 'eigenvalues', source: 'pyq', question_text: 'Eigenvalues of I?',
  options: { A: '0,0', B: '1,1', C: '2,2', D: '3,3' }, correct_answer: 'B', marks: 2, difficulty: 'medium',
};
const GEN_Q_MARKED = {
  id: 'gen-1', topic: 'determinants', source: 'generated', question_text: 'det(I)?',
  question_type: 'mcq', marks: 1, options: ['0', '1', '2'], answer_index: 1, difficulty: 0.4,
  // W3.4/E2: server-only diagnostic data (migration 054) — must never
  // reach the pre-submission client view (see the leak test below).
  distractor_failure_tags: { 0: 'method_selection', 2: 'sign' },
};
const GEN_Q_UNMARKED = {
  id: 'gen-2', topic: 'determinants', source: 'generated', question_text: 'legacy unmarked question',
  correct_answer: 'free text answer', difficulty: 0.4,
};

const NOW = new Date('2026-08-18T10:00:00.000Z');

/** In-memory stand-in for mock-exam-store.ts, ownership functions included. */
function makeFakeStore() {
  const rows = new Map<string, MockExamRow>();
  return {
    rows,
    createMockExam: async (params: any) => {
      const row: MockExamRow = {
        id: params.id, sessionId: params.sessionId, ownerUserId: params.ownerUserId ?? null,
        examKey: params.examKey, questions: params.questions, timeLimitMinutes: params.timeLimitMinutes,
        timingMode: params.timingMode ?? 'standard',
        status: 'in_progress', late: false, score: null, maxMarks: null,
        createdAtMs: NOW.getTime(), submittedAtMs: null, gradedAtMs: null, analysis: null,
        contractVersion: params.contractVersion ?? null, contractParams: params.contractParams ?? null,
      };
      rows.set(row.id, row);
      return { ...row };
    },
    getMockExam: async (id: string) => (rows.has(id) ? { ...rows.get(id)! } : null),
    claimMockExamSubmission: async (id: string, nowMs: number) => {
      const row = rows.get(id);
      if (!row) return null;
      if (row.status === 'in_progress') {
        row.status = 'submitted';
        row.submittedAtMs = nowMs;
        return { fresh: true, row: { ...row } };
      }
      return { fresh: false, row: { ...row } };
    },
    finalizeMockExamSubmission: async (id: string, outcome: any) => {
      const row = rows.get(id)!;
      Object.assign(row, { late: outcome.late, score: outcome.score, maxMarks: outcome.maxMarks, analysis: outcome.analysis, gradedAtMs: outcome.gradedAtMs });
      return { ...row };
    },
    // Mirrors mock-exam-store.ts's revertClaim guard: only reverts the
    // EXACT claim just made (same submittedAtMs, not yet graded).
    revertClaim: async (id: string, expectedSubmittedAtMs: number): Promise<boolean> => {
      const row = rows.get(id);
      if (!row) return false;
      if (row.status !== 'submitted' || row.submittedAtMs !== expectedSubmittedAtMs || row.gradedAtMs !== null) return false;
      row.status = 'in_progress';
      row.submittedAtMs = null;
      return true;
    },
    // Ownership seam — mirrors mock-exam-store.ts's real atomic-claim semantics.
    sessionOwner: async (sessionId: string) => {
      for (const row of rows.values()) {
        if (row.sessionId === sessionId && row.ownerUserId !== null) return row.ownerUserId;
      }
      return null;
    },
    claimUnclaimedSessionRows: async (sessionId: string, userId: string) => {
      for (const row of rows.values()) {
        if (row.sessionId === sessionId && row.ownerUserId === null) row.ownerUserId = userId;
      }
    },
    claimMockExamOwner: async (id: string, userId: string) => {
      const row = rows.get(id);
      if (!row) return null;
      if (row.ownerUserId === null) { row.ownerUserId = userId; return userId; }
      return row.ownerUserId;
    },
    // Plan E7/E1(b) test-safe defaults: a pure, no-DB contract resolver
    // (never a real pg connection, even when DATABASE_URL is a bogus
    // 'postgres://nowhere' set by the tests below to clear the DB-less
    // guard) and a no-op fact recorder. Individual tests override either
    // when they specifically exercise contract pinning or fact-writing.
    resolveContract: async () => compiledAssessmentContract(),
    recordAttemptFacts: async () => 0,
    // Plan W3.2: no topic evidence by default, so no skip is priced —
    // the honest default, and the one that keeps these tests hermetic.
    getTopicAccuracy: async () => ({}),
  };
}

function examConfig(questions: unknown[] = [PYQ_Q]) {
  return async () => ({
    exam_id: 'mock-1', exam_name: 'GATE', time_limit_minutes: 180,
    total_questions: questions.length, marks_scheme: { correct: 2, wrong: -0.67 },
    questions, section_breakdown: {},
  } as any);
}

describe('GET /api/gbrain/mock-exam/topics', () => {
  beforeEach(() => {
    mockRequireRole.mockReset();
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
  });

  it('requires auth', async () => {
    mockRequireRole.mockResolvedValue(null);
    const r = makeRes();
    await topicsHandler(makeReq(null), r.res);
    expect(r.payload).toBeNull();
  });

  it('returns the same id namespace mock-exam generation validates ?topics= against', async () => {
    const r = makeRes();
    await topicsHandler(makeReq(null), r.res);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.payload.topics)).toBe(true);
    expect(r.payload.topics.length).toBeGreaterThan(5);
    const byId = Object.fromEntries(r.payload.topics.map((t: any) => [t.id, t]));
    expect(byId['linear-algebra']).toBeTruthy();
    expect(byId['linear-algebra'].name).toBe('Linear Algebra');
    expect(typeof byId['linear-algebra'].weight).toBe('number');
    // The known cross-namespace trap this endpoint exists to avoid — GET
    // /api/topics uses the syllabus YAML's own section ids for these two,
    // not the canonical MARKS_WEIGHTS ones the generator actually checks.
    expect(byId['transforms']).toBeUndefined();
    expect(byId['discrete']).toBeUndefined();
    expect(byId['transform-theory']).toBeTruthy();
    expect(byId['discrete-mathematics']).toBeTruthy();
  });

  it('is registered ahead of the :sessionId route so it is never shadowed by it', () => {
    const topicsIndex = mockExamRoutes.findIndex((r) => r.method === 'GET' && r.path === '/api/gbrain/mock-exam/topics');
    const sessionIndex = mockExamRoutes.findIndex((r) => r.method === 'GET' && r.path === '/api/gbrain/mock-exam/:sessionId');
    expect(topicsIndex).toBeGreaterThanOrEqual(0);
    expect(topicsIndex).toBeLessThan(sessionIndex);
  });
});

describe('GET /api/gbrain/mock-exam/:sessionId', () => {
  let originalDb: string | undefined;

  beforeEach(() => {
    mockRequireRole.mockReset();
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
    originalDb = process.env.DATABASE_URL;
    // Every pre-existing test in this block exercises the (deps-injected,
    // Postgres-free) generation path assuming a DB is configured — only
    // the new DB-less guard test below deletes this. Default it here so
    // the new early-return guard doesn't flip every other test to 503.
    process.env.DATABASE_URL = 'postgres://nowhere';
  });
  afterEach(() => {
    setMockExamDepsForTests(null);
    if (originalDb === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDb;
  });

  it('503s with no DATABASE_URL, before ever reaching generation, and never leaks the internal store message', async () => {
    delete process.env.DATABASE_URL;
    const store = makeFakeStore();
    const generateMock = vi.fn();
    setMockExamDepsForTests({ ...store, generateMockExam: generateMock, now: () => NOW });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'anon-uuid-xyz' }), r.res);
    expect(r.status).toBe(503);
    expect(generateMock).not.toHaveBeenCalled();
    const raw = JSON.stringify(r.payload);
    // The leak this test guards against: mock-exam-store.ts throws the
    // literal string '[mock-exam-store] DATABASE_URL not configured', and
    // the pre-fix 500 catch echoed err.message straight to the client.
    expect(raw).not.toContain('DATABASE_URL');
  });

  it('an ownership-lookup failure (DATABASE_URL set, but the lookup itself throws) is a 503 and fails CLOSED — generation never runs', async () => {
    process.env.DATABASE_URL = 'postgres://nowhere';
    const generateMock = vi.fn();
    setMockExamDepsForTests({
      generateMockExam: generateMock,
      claimUnclaimedSessionRows: async () => { throw new Error('[mock-exam-store] DATABASE_URL not configured'); },
      sessionOwner: async () => { throw new Error('should not be reached'); },
      now: () => NOW,
    });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'anon-uuid-xyz' }), r.res);
    expect(r.status).toBe(503);
    // Fail-closed property: a DB error in the ownership check must never
    // be treated as "no owner found, proceed" — this is the exact IDOR
    // this check exists to prevent from reopening.
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('requires auth — denies the request and never touches generation when requireRole rejects', async () => {
    // requireRole is fully mocked here (as production requireRole would
    // have already sent the 401 and returned null), so this locks the
    // HANDLER's OWN denial behavior: it must return immediately without
    // ever reaching generation/persistence — this would still pass a
    // weaker "requireRole was called" assertion even if the `if (!user)
    // return;` guard were deleted, since it never inspects what the
    // handler does with a null user.
    mockRequireRole.mockResolvedValue(null);
    const generateMock = vi.fn();
    const createMock = vi.fn();
    const sessionOwnerMock = vi.fn();
    setMockExamDepsForTests({ generateMockExam: generateMock, createMockExam: createMock, sessionOwner: sessionOwnerMock });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 's1' }), r.res);
    expect(mockRequireRole).toHaveBeenCalled();
    expect(generateMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expect(sessionOwnerMock).not.toHaveBeenCalled();
    expect(r.payload).toBeNull(); // no response body was ever written — the handler returned before touching res
  });

  it('a student generating under sessionId !== their own userId succeeds (sessionId is the calibration key, not an identity check)', async () => {
    const store = makeFakeStore();
    setMockExamDepsForTests({ generateMockExam: examConfig(), ...store, now: () => NOW });
    const r = makeRes();
    // 'student-1' is the authenticated caller; 'anon-uuid-xyz' is their
    // browser's anonymous useSession() id — a genuinely different string,
    // exactly the real MockExamPage.tsx shape.
    await generateHandler(makeReq(null, { sessionId: 'anon-uuid-xyz' }), r.res);
    expect(r.status).toBe(200);
    expect(store.rows.get('mock-1')!.ownerUserId).toBe('student-1');
    expect(store.rows.get('mock-1')!.sessionId).toBe('anon-uuid-xyz');
  });

  it('the SAME student can generate again under a session they already established ownership of', async () => {
    const store = makeFakeStore();
    setMockExamDepsForTests({ generateMockExam: examConfig(), ...store, now: () => NOW });

    const first = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'anon-uuid-xyz' }), first.res);
    expect(first.status).toBe(200);

    const second = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'anon-uuid-xyz' }), second.res);
    expect(second.status).toBe(200);
  });

  it('blocks a DIFFERENT student from generating under a session another student already owns (IDOR)', async () => {
    const store = makeFakeStore();
    setMockExamDepsForTests({ generateMockExam: examConfig(), ...store, now: () => NOW });

    // student-1 establishes ownership of this session first.
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
    await generateHandler(makeReq(null, { sessionId: 'shared-anon-uuid' }), makeRes().res);

    // student-2 tries to reuse/guess the same sessionId.
    mockRequireRole.mockResolvedValue({ userId: 'student-2', role: 'student' });
    const generateMock = vi.fn();
    setMockExamDepsForTests({ ...store, generateMockExam: generateMock, now: () => NOW });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'shared-anon-uuid' }), r.res);
    expect(r.status).toBe(403);
    expect(generateMock).not.toHaveBeenCalled(); // never even reaches generation
  });

  it('legacy NULL-owner row: the first authenticated GET claims it, locking out a later different student', async () => {
    const store = makeFakeStore();
    // Simulate a pre-fix row: created before owner_user_id existed.
    await store.createMockExam({
      id: 'legacy-1', sessionId: 'legacy-session', ownerUserId: null, examKey: 'gate',
      questions: [PYQ_Q], timeLimitMinutes: 180,
    });
    setMockExamDepsForTests({ generateMockExam: examConfig(), ...store, now: () => NOW });

    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'legacy-session' }), r.res);
    expect(r.status).toBe(200);
    // The PRE-EXISTING legacy row got claimed, not just the new one.
    expect(store.rows.get('legacy-1')!.ownerUserId).toBe('student-1');

    // A different student is now locked out of that session.
    mockRequireRole.mockResolvedValue({ userId: 'student-2', role: 'student' });
    const generateMock = vi.fn();
    setMockExamDepsForTests({ ...store, generateMockExam: generateMock, now: () => NOW });
    const r2 = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'legacy-session' }), r2.res);
    expect(r2.status).toBe(403);
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('allows a teacher to generate under a session another student already owns (exempt from ownership)', async () => {
    const store = makeFakeStore();
    setMockExamDepsForTests({ generateMockExam: examConfig(), ...store, now: () => NOW });
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
    await generateHandler(makeReq(null, { sessionId: 'student-session' }), makeRes().res);

    mockRequireRole.mockResolvedValue({ userId: 'teacher-1', role: 'teacher' });
    setMockExamDepsForTests({ generateMockExam: examConfig(), ...store, now: () => NOW });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'student-session' }), r.res);
    expect(r.status).toBe(200);
  });

  it('NEVER leaks correct_answer / answer_index / answer_indices / answer_range to the client', async () => {
    const store = makeFakeStore();
    setMockExamDepsForTests({
      generateMockExam: examConfig([PYQ_Q, GEN_Q_MARKED, GEN_Q_UNMARKED]),
      ...store,
      now: () => NOW,
    });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'anon-uuid-xyz' }), r.res);
    expect(r.status).toBe(200);

    const raw = JSON.stringify(r.payload);
    expect(raw).not.toContain('correct_answer');
    expect(raw).not.toContain('correctAnswer');
    expect(raw).not.toContain('answer_index');
    expect(raw).not.toContain('answer_indices');
    expect(raw).not.toContain('answerIndex');
    expect(raw).not.toContain('answer_range');
    // and the actual secret VALUES don't leak either
    expect(raw).not.toContain('free text answer');
    // W3.4/E2: no field naming a failure/trap/misconception hypothesis
    // ever reaches the pre-submission client view (GEN_Q_MARKED carries
    // distractor_failure_tags — see the fixture above).
    expect(raw).not.toMatch(/failure|trap|misconception/i);

    // gradable flag is honest — the unmarked legacy row is NOT claimed gradable
    const byId = Object.fromEntries(r.payload.questions.map((q: any) => [q.id, q]));
    expect(byId['pyq-1'].gradable).toBe(true);
    expect(byId['gen-1'].gradable).toBe(true);
    expect(byId['gen-2'].gradable).toBe(false);
  });

  // ────────────────────────────────────────────────────────────────────
  // C1 — topic-wise mocks (buyer demo-prep Q7)
  // ────────────────────────────────────────────────────────────────────

  it('400s an unknown topic and never reaches generation', async () => {
    const store = makeFakeStore();
    const generateMock = vi.fn();
    setMockExamDepsForTests({ generateMockExam: generateMock, ...store, now: () => NOW });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'anon-uuid-xyz' }, { topics: 'linear-algebra,not-a-real-topic' }), r.res);
    expect(r.status).toBe(400);
    expect(r.payload.error).toContain('not-a-real-topic');
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('threads a valid, deduped topics list through to generateMockExam', async () => {
    const store = makeFakeStore();
    const generateMock = vi.fn(examConfig());
    setMockExamDepsForTests({ generateMockExam: generateMock, ...store, now: () => NOW });
    const r = makeRes();
    await generateHandler(
      makeReq(null, { sessionId: 'anon-uuid-xyz' }, { topics: ' linear-algebra , calculus ,linear-algebra' }),
      r.res,
    );
    expect(r.status).toBe(200);
    expect(generateMock).toHaveBeenCalledWith('anon-uuid-xyz', 'gate', {
      topics: ['linear-algebra', 'calculus'],
      timingMode: 'standard',
    });
    expect(r.payload.topics).toEqual(['linear-algebra', 'calculus']);
  });

  it('omitting topics entirely reports topics: null and passes undefined through', async () => {
    const store = makeFakeStore();
    const generateMock = vi.fn(examConfig());
    setMockExamDepsForTests({ generateMockExam: generateMock, ...store, now: () => NOW });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'anon-uuid-xyz' }), r.res);
    expect(r.status).toBe(200);
    expect(generateMock).toHaveBeenCalledWith('anon-uuid-xyz', 'gate', { topics: undefined, timingMode: 'standard' });
    expect(r.payload.topics).toBeNull();
  });

  // ────────────────────────────────────────────────────────────────────
  // C2 — exam-feel timing modes (buyer demo-prep Q7)
  // ────────────────────────────────────────────────────────────────────

  it('400s an unknown timing mode and never reaches generation', async () => {
    const store = makeFakeStore();
    const generateMock = vi.fn();
    setMockExamDepsForTests({ generateMockExam: generateMock, ...store, now: () => NOW });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'anon-uuid-xyz' }, { mode: 'turbo' }), r.res);
    expect(r.status).toBe(400);
    expect(r.payload.error).toContain('turbo');
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('threads a valid timing mode through to generateMockExam and persists it on the row', async () => {
    const store = makeFakeStore();
    const generateMock = vi.fn(examConfig());
    setMockExamDepsForTests({ generateMockExam: generateMock, ...store, now: () => NOW });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'anon-uuid-xyz' }, { mode: 'rush' }), r.res);
    expect(r.status).toBe(200);
    expect(generateMock).toHaveBeenCalledWith('anon-uuid-xyz', 'gate', { topics: undefined, timingMode: 'rush' });
    expect(r.payload.timing_mode).toBe('rush');
    expect(store.rows.get('mock-1')!.timingMode).toBe('rush');
  });

  // ────────────────────────────────────────────────────────────────────
  // Plan E7 — contract pinned at generation
  // ────────────────────────────────────────────────────────────────────
  it('plan E7: resolves the contract ONCE and pins version + params onto the row', async () => {
    const store = makeFakeStore();
    const resolveContract = vi.fn(async () => compiledAssessmentContract());
    setMockExamDepsForTests({ generateMockExam: examConfig(), ...store, resolveContract, now: () => NOW });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'anon-uuid-xyz' }), r.res);
    expect(r.status).toBe(200);
    expect(resolveContract).toHaveBeenCalledTimes(1);
    const row = store.rows.get('mock-1')!;
    expect(row.contractVersion).toBe('gate-2026+compiled');
    expect(row.contractParams).toEqual(snapshotForCreation(compiledAssessmentContract()).params);
  });
});

describe('POST /api/gbrain/mock-exam/:id/submit', () => {
  beforeEach(() => {
    mockRequireRole.mockReset();
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
  });
  afterEach(() => setMockExamDepsForTests(null));

  async function seededExam(ownerUserId: string | null = 'student-1', timingMode: 'standard' | 'compressed' | 'rush' = 'standard') {
    const store = makeFakeStore();
    await store.createMockExam({
      id: 'mock-1', sessionId: 'anon-uuid-xyz', ownerUserId, examKey: 'gate',
      questions: [PYQ_Q, GEN_Q_MARKED, GEN_Q_UNMARKED], timeLimitMinutes: 180, timingMode,
    });
    return store;
  }

  it('C2: submit response reports the timing mode the exam was generated under, and replays it on double-submit', async () => {
    const store = await seededExam('student-1', 'rush');
    setMockExamDepsForTests({ ...store, now: () => NOW });
    const first = makeRes();
    await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), first.res);
    expect(first.payload.timing_mode).toBe('rush');

    const second = makeRes();
    await submitHandler(makeReq({ responses: [] }, { id: 'mock-1' }), second.res);
    expect(second.payload.replayed).toBe(true);
    expect(second.payload.timing_mode).toBe('rush');
  });

  it('grades pyq (letter-keyed) and generated (index-keyed) questions via the deterministic scorer, excludes ungraded from the total', async () => {
    const store = await seededExam();
    setMockExamDepsForTests({ ...store, now: () => NOW });
    const r = makeRes();
    await submitHandler(makeReq({
      responses: [
        { id: 'pyq-1', selectedIndex: 1 },  // correct (B = index 1)
        { id: 'gen-1', selectedIndex: 0 },  // wrong (answer_index=1)
        // gen-2 unanswered — irrelevant anyway, it's ungraded
      ],
    }, { id: 'mock-1' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.correct).toBe(1);
    expect(r.payload.wrong).toBe(1);
    expect(r.payload.ungraded).toBe(1);
    expect(r.payload.max_marks).toBe(3); // 2 (pyq) + 1 (gen-1); gen-2 excluded
    expect(r.payload.late).toBe(false);
  });

  it('flags a late submission (deadline = created_at + time_limit_minutes) but still grades it', async () => {
    const store = await seededExam();
    const late = new Date(NOW.getTime() + 181 * 60 * 1000); // 181 min after a 180-min exam
    setMockExamDepsForTests({ ...store, now: () => late });
    const r = makeRes();
    await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.late).toBe(true);
    expect(r.payload.correct).toBe(1); // still fully graded
  });

  it('double-submit is idempotent — replays the persisted analysis, never re-grades', async () => {
    const store = await seededExam();
    setMockExamDepsForTests({ ...store, now: () => NOW });

    const first = makeRes();
    await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), first.res);

    // Second call sends a DIFFERENT (bogus) response — must not change the outcome.
    const second = makeRes();
    await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 0 }] }, { id: 'mock-1' }), second.res);
    expect(second.status).toBe(200);
    expect(second.payload.correct).toBe(first.payload.correct);
    expect(second.payload.marks).toBe(first.payload.marks);
    expect(second.payload.replayed).toBe(true);
  });

  it('404s an unknown exam id', async () => {
    const store = await seededExam();
    setMockExamDepsForTests({ ...store, now: () => NOW });
    const r = makeRes();
    await submitHandler(makeReq({ responses: [] }, { id: 'nope' }), r.res);
    expect(r.status).toBe(404);
  });

  it('blocks a student from submitting to an exam owned by a DIFFERENT student (IDOR) even with session_id OMITTED from the body', async () => {
    const store = await seededExam('other-student');
    setMockExamDepsForTests({ ...store, now: () => NOW });
    const r = makeRes();
    // No session_id field at all — the old body-volunteered check would
    // have silently skipped ownership entirely here.
    await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
    expect(r.status).toBe(404);
  });

  it('blocks a student from submitting to another student\'s exam even when the body LIES about session_id', async () => {
    const store = await seededExam('other-student');
    setMockExamDepsForTests({ ...store, now: () => NOW });
    const r = makeRes();
    // Body claims the right session — must not be trusted; ownership is
    // enforced against the stored owner_user_id only.
    await submitHandler(makeReq({ session_id: 'anon-uuid-xyz', responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
    expect(r.status).toBe(404);
  });

  it('legacy NULL-owner exam: the submitting student claims it and grades normally', async () => {
    const store = await seededExam(null);
    setMockExamDepsForTests({ ...store, now: () => NOW });
    const r = makeRes();
    await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.correct).toBe(1);
    expect(store.rows.get('mock-1')!.ownerUserId).toBe('student-1');
  });

  it('legacy NULL-owner exam already claimed by another student blocks a second student from submitting', async () => {
    const store = await seededExam(null);
    setMockExamDepsForTests({ ...store, now: () => NOW });

    // student-1 claims it via a first submit.
    await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), makeRes().res);
    expect(store.rows.get('mock-1')!.ownerUserId).toBe('student-1');

    // student-2 now tries the same exam id.
    mockRequireRole.mockResolvedValue({ userId: 'student-2', role: 'student' });
    const r = makeRes();
    await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
    expect(r.status).toBe(404);
  });

  it('allows a teacher to grade a submission for an exam owned by a student (exempt from ownership)', async () => {
    mockRequireRole.mockResolvedValue({ userId: 'teacher-1', role: 'teacher' });
    const store = await seededExam('some-student');
    setMockExamDepsForTests({ ...store, now: () => NOW });
    const r = makeRes();
    await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.correct).toBe(1);
  });

  it('allows a student to submit to their OWN exam', async () => {
    const store = await seededExam('student-1');
    setMockExamDepsForTests({ ...store, now: () => NOW });
    const r = makeRes();
    await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.correct).toBe(1);
  });

  // ────────────────────────────────────────────────────────────────────
  // Adversarial-review fix: claim-before-grade brick
  // ────────────────────────────────────────────────────────────────────
  //
  // claimMockExamSubmission commits in_progress → submitted BEFORE
  // gradeMockExam runs, and the original handler had no try/catch around
  // that call at all. Without a revert-on-throw, a grading exception would
  // leave the row stuck 'submitted' forever with analysis: null — every
  // retry hitting the `!claim.fresh` replay branch and returning an empty
  // analysis as `recorded: true`. This locks: the row goes back to
  // 'in_progress' on a grading throw, and a retry re-grades for real.
  describe('grading throw reverts the claim instead of bricking the exam', () => {
    afterEach(() => {
      vi.mocked(gradeMockExam).mockClear();
    });

    it('a grading exception returns 500 and puts the row back to in_progress (not stuck submitted)', async () => {
      const store = await seededExam();
      setMockExamDepsForTests({ ...store, now: () => NOW });
      vi.mocked(gradeMockExam).mockRejectedValueOnce(new Error('grading boom'));

      const r = makeRes();
      await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);

      expect(r.status).toBe(500);
      const row = store.rows.get('mock-1')!;
      expect(row.status).toBe('in_progress');
      expect(row.submittedAtMs).toBeNull();
      expect(row.analysis).toBeNull();
    });

    it('a retry after a reverted grading failure actually re-grades — not a bricked replay', async () => {
      const store = await seededExam();
      setMockExamDepsForTests({ ...store, now: () => NOW });
      vi.mocked(gradeMockExam).mockRejectedValueOnce(new Error('grading boom'));

      const failed = makeRes();
      await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), failed.res);
      expect(failed.status).toBe(500);

      // gradeMockExam behaves normally on this second call (no further
      // mockRejectedValueOnce queued) — the retry should actually grade.
      const retried = makeRes();
      await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), retried.res);

      expect(retried.status).toBe(200);
      expect(retried.payload.replayed).toBeUndefined(); // a REAL grade, not a stale replay
      expect(retried.payload.correct).toBe(1);
      expect(store.rows.get('mock-1')!.status).toBe('submitted');
    });

    it('the successful (non-throwing) path never calls revertClaim', async () => {
      const store = await seededExam();
      const revertClaim = vi.fn(store.revertClaim);
      setMockExamDepsForTests({ ...store, revertClaim, now: () => NOW });
      const r = makeRes();
      await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
      expect(r.status).toBe(200);
      expect(revertClaim).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Plan E7 — contract pinned at generation, read at grading
  // ────────────────────────────────────────────────────────────────────
  describe('assessment contract pinning (E7)', () => {
    it('grading from the pinned contract produces the same marks as the legacy (unpinned) path', async () => {
      // Pinned: contractVersion/contractParams set from the compiled contract.
      const pinned = makeFakeStore();
      const snapshot = snapshotForCreation(compiledAssessmentContract());
      await pinned.createMockExam({
        id: 'mock-1', sessionId: 'anon-uuid-xyz', ownerUserId: 'student-1', examKey: 'gate',
        questions: [PYQ_Q, GEN_Q_MARKED], timeLimitMinutes: 180,
        contractVersion: snapshot.version, contractParams: snapshot.params,
      });
      setMockExamDepsForTests({ ...pinned, now: () => NOW });
      const rPinned = makeRes();
      await submitHandler(makeReq({
        responses: [{ id: 'pyq-1', selectedIndex: 1 }, { id: 'gen-1', selectedIndex: 0 }],
      }, { id: 'mock-1' }), rPinned.res);

      // Legacy: no contract columns at all (null).
      const legacy = makeFakeStore();
      await legacy.createMockExam({
        id: 'mock-2', sessionId: 'anon-uuid-xyz', ownerUserId: 'student-1', examKey: 'gate',
        questions: [PYQ_Q, GEN_Q_MARKED], timeLimitMinutes: 180,
      });
      setMockExamDepsForTests({ ...legacy, now: () => NOW });
      const rLegacy = makeRes();
      await submitHandler(makeReq({
        responses: [{ id: 'pyq-1', selectedIndex: 1 }, { id: 'gen-1', selectedIndex: 0 }],
      }, { id: 'mock-2' }), rLegacy.res);

      expect(rPinned.status).toBe(200);
      expect(rLegacy.status).toBe(200);
      expect(rPinned.payload.marks).toBe(rLegacy.payload.marks);
      expect(rPinned.payload.correct).toBe(rLegacy.payload.correct);
      expect(rPinned.payload.wrong).toBe(rLegacy.payload.wrong);
    });

    it('an unregistered strategy in the pinned snapshot refuses the submission by name (D8) rather than grading under invented rules', async () => {
      const store = makeFakeStore();
      await store.createMockExam({
        id: 'mock-1', sessionId: 'anon-uuid-xyz', ownerUserId: 'student-1', examKey: 'gate',
        questions: [PYQ_Q], timeLimitMinutes: 180,
        contractVersion: 'jee-adv-2027',
        contractParams: { marking: { mcq: { strategy: 'jee_adv_2027' } } },
      });
      setMockExamDepsForTests({ ...store, now: () => NOW });
      const r = makeRes();
      await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
      expect(r.status).toBe(500);
      // The row is reverted to in_progress, not stuck 'submitted' — same
      // adversarial-review discipline as every other grading throw.
      expect(store.rows.get('mock-1')!.status).toBe('in_progress');
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Plan E1(b) — attempt_facts written per gradable question at grade time
  // ────────────────────────────────────────────────────────────────────
  describe('attempt_facts write path (E1b)', () => {
    it('writes one fact per GRADABLE question, excludes the ungraded one, and never blocks the response', async () => {
      const store = await seededExam();
      const recordAttemptFacts = vi.fn(async () => 0);
      setMockExamDepsForTests({ ...store, recordAttemptFacts, now: () => NOW });
      const r = makeRes();
      await submitHandler(makeReq({
        responses: [{ id: 'pyq-1', selectedIndex: 1 }, { id: 'gen-1', selectedIndex: 0 }],
      }, { id: 'mock-1' }), r.res);

      expect(r.status).toBe(200);
      expect(recordAttemptFacts).toHaveBeenCalledTimes(1);
      const facts = recordAttemptFacts.mock.calls[0][0] as Array<Record<string, unknown>>;
      // pyq-1 (correct mcq) + gen-1 (wrong mcq) + gen-2 (skipped, but still
      // GRADABLE only if it normalizes — gen-2 is the unmarked legacy row,
      // so it is excluded: no question_kind exists for it to stamp.
      expect(facts.map((f) => f.objectId).sort()).toEqual(['gen-1', 'pyq-1']);
      const byId = Object.fromEntries(facts.map((f) => [f.objectId, f]));
      expect(byId['pyq-1']).toMatchObject({ studentId: 'student-1', questionKind: 'mcq', skipped: false, marksEarned: 2, marksMax: 2 });
      expect(byId['gen-1']).toMatchObject({ studentId: 'student-1', questionKind: 'mcq', skipped: false, marksMax: 1 });
      expect(byId['gen-1'].marksEarned as number).toBeLessThan(0); // wrong MCQ, negative marking
    });

    it('a failed attempt_facts write is logged and does not affect the grade returned', async () => {
      const store = await seededExam();
      const recordAttemptFacts = vi.fn(async () => { throw new Error('attempt_facts table missing'); });
      setMockExamDepsForTests({ ...store, recordAttemptFacts, now: () => NOW });
      const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
      const r = makeRes();
      await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
      expect(r.status).toBe(200);
      expect(r.payload.correct).toBe(1);
      expect(consoleErr).toHaveBeenCalledWith(
        expect.stringContaining('attempt_facts write failed'),
        'attempt_facts table missing',
      );
      consoleErr.mockRestore();
    });

    it('a double-submit replay never writes attempt_facts a second time', async () => {
      const store = await seededExam();
      const recordAttemptFacts = vi.fn(async () => 0);
      setMockExamDepsForTests({ ...store, recordAttemptFacts, now: () => NOW });
      await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), makeRes().res);
      await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 0 }] }, { id: 'mock-1' }), makeRes().res);
      expect(recordAttemptFacts).toHaveBeenCalledTimes(1);
    });
  });
});

// ────────────────────────────────────────────────────────────────────
// W3.2 — the attempt/skip counterfactual on the result path
// ────────────────────────────────────────────────────────────────────

describe('W3.2 counterfactual', () => {
  beforeEach(() => {
    mockRequireRole.mockReset();
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
  });
  afterEach(() => setMockExamDepsForTests(null));

  async function seeded(questions: unknown[] = [PYQ_Q, GEN_Q_MARKED, GEN_Q_UNMARKED]) {
    const store = makeFakeStore();
    await store.createMockExam({
      id: 'mock-1', sessionId: 'anon-uuid-xyz', ownerUserId: 'student-1', examKey: 'gate',
      questions, timeLimitMinutes: 180, timingMode: 'standard',
    });
    return store;
  }

  it('persists the E3 per-question decomposition into the saved analysis', async () => {
    const store = await seeded();
    setMockExamDepsForTests({ ...store, now: () => NOW });
    await submitHandler(makeReq({
      responses: [{ id: 'pyq-1', selectedIndex: 1 }, { id: 'gen-1', selectedIndex: 0 }],
    }, { id: 'mock-1' }), makeRes().res);

    const saved = (await store.getMockExam('mock-1'))!.analysis as any;
    expect(Array.isArray(saved.per_question)).toBe(true);
    // gen-2 is ungraded, so it contributes no entry — never guessed.
    expect(saved.per_question.map((q: any) => q.id).sort()).toEqual(['gen-1', 'pyq-1']);
    expect(saved.per_question[0]).toHaveProperty('kind');
    expect(saved.per_question[0]).toHaveProperty('max');
  });

  it('the submit response carries the counterfactual, priced from the wrong attempt', async () => {
    const store = await seeded();
    setMockExamDepsForTests({ ...store, now: () => NOW });
    const r = makeRes();
    await submitHandler(makeReq({
      responses: [{ id: 'pyq-1', selectedIndex: 1 }, { id: 'gen-1', selectedIndex: 0 }],
    }, { id: 'mock-1' }), r.res);

    const cf = r.payload.counterfactual;
    expect(cf.available).toBe(true);
    expect(cf.state).toBe('decisions');
    expect(cf.top_decisions).toHaveLength(1);
    // gen-1 is a wrong 1-mark MCQ → -1/3.
    expect(cf.top_decisions[0].object_id).toBe('gen-1');
    expect(cf.top_decisions[0].cost_marks).toBeCloseTo(0.33, 2);
    expect(cf.top_decisions[0].topic).toBe('determinants');
    expect(cf.drill_concept_id).toBeNull();  // neither fixture row carries concept_id
    expect(cf.beats.gap).toContain('attempt-or-skip calls');
  });

  it('joins the topic and concept off the stored question rows', async () => {
    const store = await seeded([
      { ...GEN_Q_MARKED, concept_id: 'la-05' },
    ]);
    setMockExamDepsForTests({ ...store, now: () => NOW });
    const r = makeRes();
    await submitHandler(makeReq({ responses: [{ id: 'gen-1', selectedIndex: 0 }] }, { id: 'mock-1' }), r.res);
    expect(r.payload.counterfactual.drill_concept_id).toBe('la-05');
  });

  it('prices a skip only when the topic evidence is there', async () => {
    const store = await seeded([PYQ_Q, GEN_Q_MARKED]);
    setMockExamDepsForTests({
      ...store,
      getTopicAccuracy: async () => ({ eigenvalues: { attempted: 20, correct: 14 } }),
      now: () => NOW,
    });
    const r = makeRes();
    // pyq-1 (eigenvalues, 2 marks) skipped; gen-1 answered correctly.
    await submitHandler(makeReq({ responses: [{ id: 'gen-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
    const cf = r.payload.counterfactual;
    expect(cf.top_decisions).toHaveLength(1);
    expect(cf.top_decisions[0].decision).toBe('skipped_positive_ev');
    expect(cf.top_decisions[0].topic_attempts).toBe(20);
  });

  it('does not read topic evidence at all when nothing was skipped', async () => {
    const store = await seeded([GEN_Q_MARKED]);
    const getTopicAccuracy = vi.fn(async () => ({}));
    setMockExamDepsForTests({ ...store, getTopicAccuracy, now: () => NOW });
    await submitHandler(makeReq({ responses: [{ id: 'gen-1', selectedIndex: 1 }] }, { id: 'mock-1' }), makeRes().res);
    expect(getTopicAccuracy).not.toHaveBeenCalled();
  });

  it('a topic-evidence read failure omits skip lines rather than failing the submit', async () => {
    const store = await seeded([PYQ_Q, GEN_Q_MARKED]);
    setMockExamDepsForTests({
      ...store,
      getTopicAccuracy: async () => { throw new Error('attempt_facts unreachable'); },
      now: () => NOW,
    });
    const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = makeRes();
    await submitHandler(makeReq({ responses: [{ id: 'gen-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.counterfactual.available).toBe(true);
    expect(r.payload.counterfactual.top_decisions).toEqual([]);
    consoleErr.mockRestore();
  });

  describe('legacy rows (E3 degradation)', () => {
    it('an analysis with no per_question key renders headline-only', async () => {
      const store = await seeded();
      // A row exactly as a pre-E3 deploy left it.
      await store.claimMockExamSubmission('mock-1', NOW.getTime());
      await store.finalizeMockExamSubmission('mock-1', {
        late: false, score: 4, maxMarks: 5, gradedAtMs: NOW.getTime(),
        analysis: { total: 3, correct: 2, wrong: 1, skipped: 0, ungraded: 1, marks: 4, max_marks: 5, accuracy: 67, by_topic: {} },
      });
      setMockExamDepsForTests({ ...store, now: () => NOW });

      const r = makeRes();
      await resultHandler(makeReq(null, { id: 'mock-1' }), r.res);
      expect(r.status).toBe(200);
      expect(r.payload.marks).toBe(4);
      expect(r.payload.counterfactual.available).toBe(false);
      expect(r.payload.counterfactual.state).toBe('unavailable');
      expect(r.payload.counterfactual.reason).toContain('graded before per-question analysis existed');
      expect(r.payload.counterfactual.top_decisions).toEqual([]);
    });

    it('a replayed double-submit of a legacy row degrades the same way', async () => {
      const store = await seeded();
      await store.claimMockExamSubmission('mock-1', NOW.getTime());
      await store.finalizeMockExamSubmission('mock-1', {
        late: false, score: 4, maxMarks: 5, gradedAtMs: NOW.getTime(), analysis: { marks: 4 },
      });
      setMockExamDepsForTests({ ...store, now: () => NOW });
      const r = makeRes();
      await submitHandler(makeReq({ responses: [] }, { id: 'mock-1' }), r.res);
      expect(r.payload.replayed).toBe(true);
      expect(r.payload.counterfactual.state).toBe('unavailable');
    });
  });

  describe('GET /api/gbrain/mock-exam/:id/result', () => {
    it('replays the same screen from the persisted analysis on a revisit', async () => {
      const store = await seeded();
      setMockExamDepsForTests({ ...store, now: () => NOW });
      const submitted = makeRes();
      await submitHandler(makeReq({
        responses: [{ id: 'pyq-1', selectedIndex: 1 }, { id: 'gen-1', selectedIndex: 0 }],
      }, { id: 'mock-1' }), submitted.res);

      const revisit = makeRes();
      await resultHandler(makeReq(null, { id: 'mock-1' }), revisit.res);
      expect(revisit.status).toBe(200);
      expect(revisit.payload.marks).toBe(submitted.payload.marks);
      expect(revisit.payload.counterfactual.top_decisions)
        .toEqual(submitted.payload.counterfactual.top_decisions);
    });

    it('404s a student reaching another student\'s exam — never a 403 that confirms the id', async () => {
      const store = await seeded();
      setMockExamDepsForTests({ ...store, now: () => NOW });
      await submitHandler(makeReq({ responses: [] }, { id: 'mock-1' }), makeRes().res);

      mockRequireRole.mockResolvedValue({ userId: 'student-2', role: 'student' });
      const r = makeRes();
      await resultHandler(makeReq(null, { id: 'mock-1' }), r.res);
      expect(r.status).toBe(404);
      expect(r.payload.error).toBe('unknown mock exam: mock-1');
    });

    it('409s an exam that has not been submitted yet', async () => {
      const store = await seeded();
      setMockExamDepsForTests({ ...store, now: () => NOW });
      const r = makeRes();
      await resultHandler(makeReq(null, { id: 'mock-1' }), r.res);
      expect(r.status).toBe(409);
      expect(r.payload.error).toContain('has not been submitted yet');
    });

    it('requires auth', async () => {
      mockRequireRole.mockResolvedValue(null);
      const r = makeRes();
      await resultHandler(makeReq(null, { id: 'mock-1' }), r.res);
      expect(r.payload).toBeNull();
    });

    it('is registered ahead of the :sessionId route so it is never shadowed by it', () => {
      const resultIndex = mockExamRoutes.findIndex((r) => r.method === 'GET' && r.path === '/api/gbrain/mock-exam/:id/result');
      const sessionIndex = mockExamRoutes.findIndex((r) => r.method === 'GET' && r.path === '/api/gbrain/mock-exam/:sessionId');
      expect(resultIndex).toBeGreaterThanOrEqual(0);
      expect(resultIndex).toBeLessThan(sessionIndex);
    });
  });
});
