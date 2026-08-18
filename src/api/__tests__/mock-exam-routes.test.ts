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

function makeReq(body: unknown, params: Record<string, string> = {}) {
  return { pathname: '/', query: new URLSearchParams(), params, body, headers: {} } as any;
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
        status: 'in_progress', late: false, score: null, maxMarks: null,
        createdAtMs: NOW.getTime(), submittedAtMs: null, gradedAtMs: null, analysis: null,
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
  };
}

function examConfig(questions: unknown[] = [PYQ_Q]) {
  return async () => ({
    exam_id: 'mock-1', exam_name: 'GATE', time_limit_minutes: 180,
    total_questions: questions.length, marks_scheme: { correct: 2, wrong: -0.67 },
    questions, section_breakdown: {},
  } as any);
}

describe('GET /api/gbrain/mock-exam/:sessionId', () => {
  beforeEach(() => {
    mockRequireRole.mockReset();
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
  });
  afterEach(() => setMockExamDepsForTests(null));

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

    // gradable flag is honest — the unmarked legacy row is NOT claimed gradable
    const byId = Object.fromEntries(r.payload.questions.map((q: any) => [q.id, q]));
    expect(byId['pyq-1'].gradable).toBe(true);
    expect(byId['gen-1'].gradable).toBe(true);
    expect(byId['gen-2'].gradable).toBe(false);
  });
});

describe('POST /api/gbrain/mock-exam/:id/submit', () => {
  beforeEach(() => {
    mockRequireRole.mockReset();
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
  });
  afterEach(() => setMockExamDepsForTests(null));

  async function seededExam(ownerUserId: string | null = 'student-1') {
    const store = makeFakeStore();
    await store.createMockExam({
      id: 'mock-1', sessionId: 'anon-uuid-xyz', ownerUserId, examKey: 'gate',
      questions: [PYQ_Q, GEN_Q_MARKED, GEN_Q_UNMARKED], timeLimitMinutes: 180,
    });
    return store;
  }

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
});
