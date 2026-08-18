/**
 * Tests for src/api/mock-exam-routes.ts — T22 (ENG-D3).
 *
 * Everything is injected through setMockExamDepsForTests() — no Postgres,
 * no JWT. requireRole is mocked. Covers: the leak discipline on
 * GET .../mock-exam/:sessionId (never an answer key, pre-submission),
 * server-side grading via the deterministic scorer for BOTH pyq- and
 * generated-sourced questions, honest handling of ungraded questions,
 * lateness, and double-submit idempotency.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerResponse } from 'http';
import type { MockExamRow } from '../../gbrain/mock-exam-store';

const mockRequireRole = vi.fn();
vi.mock('../auth-middleware', () => ({
  requireRole: (...args: any[]) => mockRequireRole(...args),
}));

const { mockExamRoutes, setMockExamDepsForTests } = await import('../mock-exam-routes');

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

function makeFakeStore() {
  const rows = new Map<string, MockExamRow>();
  return {
    createMockExam: async (params: any) => {
      const row: MockExamRow = {
        id: params.id, sessionId: params.sessionId, examKey: params.examKey, questions: params.questions,
        timeLimitMinutes: params.timeLimitMinutes, status: 'in_progress', late: false, score: null, maxMarks: null,
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
    rows,
  };
}

const NOW = new Date('2026-08-18T10:00:00.000Z');

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
    setMockExamDepsForTests({ generateMockExam: generateMock, createMockExam: createMock });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 's1' }), r.res);
    expect(mockRequireRole).toHaveBeenCalled();
    expect(generateMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expect(r.payload).toBeNull(); // no response body was ever written — the handler returned before touching res
  });

  it('blocks a student from generating a mock exam under another session id (IDOR)', async () => {
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
    const generateMock = vi.fn();
    setMockExamDepsForTests({ generateMockExam: generateMock });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'someone-elses-session' }), r.res);
    expect(r.status).toBe(403);
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('allows a student to generate a mock exam under their OWN session id', async () => {
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
    const store = makeFakeStore();
    setMockExamDepsForTests({
      generateMockExam: async () => ({
        exam_id: 'mock-1', exam_name: 'GATE', time_limit_minutes: 180,
        total_questions: 1, marks_scheme: { correct: 2, wrong: -0.67 },
        questions: [PYQ_Q], section_breakdown: {},
      } as any),
      createMockExam: store.createMockExam, getMockExam: store.getMockExam,
      claimMockExamSubmission: store.claimMockExamSubmission, finalizeMockExamSubmission: store.finalizeMockExamSubmission,
      now: () => NOW,
    });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'student-1' }), r.res);
    expect(r.status).toBe(200);
  });

  it('allows a teacher to generate a mock exam for a session that is not their own', async () => {
    mockRequireRole.mockResolvedValue({ userId: 'teacher-1', role: 'teacher' });
    const store = makeFakeStore();
    setMockExamDepsForTests({
      generateMockExam: async () => ({
        exam_id: 'mock-1', exam_name: 'GATE', time_limit_minutes: 180,
        total_questions: 1, marks_scheme: { correct: 2, wrong: -0.67 },
        questions: [PYQ_Q], section_breakdown: {},
      } as any),
      createMockExam: store.createMockExam, getMockExam: store.getMockExam,
      claimMockExamSubmission: store.claimMockExamSubmission, finalizeMockExamSubmission: store.finalizeMockExamSubmission,
      now: () => NOW,
    });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'some-student-session' }), r.res);
    expect(r.status).toBe(200);
  });

  it('NEVER leaks correct_answer / answer_index / answer_indices / answer_range to the client', async () => {
    const store = makeFakeStore();
    setMockExamDepsForTests({
      generateMockExam: async () => ({
        exam_id: 'mock-1', exam_name: 'GATE', time_limit_minutes: 180,
        total_questions: 3, marks_scheme: { correct: 2, wrong: -0.67 },
        questions: [PYQ_Q, GEN_Q_MARKED, GEN_Q_UNMARKED],
        section_breakdown: { eigenvalues: 1, determinants: 2 },
      } as any),
      createMockExam: store.createMockExam, getMockExam: store.getMockExam,
      claimMockExamSubmission: store.claimMockExamSubmission, finalizeMockExamSubmission: store.finalizeMockExamSubmission,
      now: () => NOW,
    });
    const r = makeRes();
    await generateHandler(makeReq(null, { sessionId: 'student-1' }), r.res);
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

  async function seededExam(sessionId = 'student-1') {
    const store = makeFakeStore();
    await store.createMockExam({ id: 'mock-1', sessionId, examKey: 'gate', questions: [PYQ_Q, GEN_Q_MARKED, GEN_Q_UNMARKED], timeLimitMinutes: 180 });
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

  it('blocks a student from submitting to another session\'s exam (IDOR) even with session_id OMITTED from the body', async () => {
    // exam belongs to 'someone-elses-session'; the authenticated caller is 'student-1'.
    const store = await seededExam('someone-elses-session');
    setMockExamDepsForTests({ ...store, now: () => NOW });
    const r = makeRes();
    // No session_id field at all — the old body-volunteered check would
    // have silently skipped ownership entirely here.
    await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
    expect(r.status).toBe(404);
  });

  it('blocks a student from submitting to another session\'s exam even when the body LIES about session_id', async () => {
    const store = await seededExam('someone-elses-session');
    setMockExamDepsForTests({ ...store, now: () => NOW });
    const r = makeRes();
    // Body claims ownership of the right session — must not be trusted.
    await submitHandler(makeReq({ session_id: 'someone-elses-session', responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
    expect(r.status).toBe(404);
  });

  it('allows a teacher to grade a submission for an exam that is not their own session', async () => {
    mockRequireRole.mockResolvedValue({ userId: 'teacher-1', role: 'teacher' });
    const store = await seededExam('some-student-session');
    setMockExamDepsForTests({ ...store, now: () => NOW });
    const r = makeRes();
    await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.correct).toBe(1);
  });

  it('allows a student to submit to their OWN session\'s exam', async () => {
    const store = await seededExam('student-1');
    setMockExamDepsForTests({ ...store, now: () => NOW });
    const r = makeRes();
    await submitHandler(makeReq({ responses: [{ id: 'pyq-1', selectedIndex: 1 }] }, { id: 'mock-1' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.correct).toBe(1);
  });
});
