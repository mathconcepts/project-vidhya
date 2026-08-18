/**
 * Tests for src/api/quiz-routes.ts — T14 (B5).
 *
 * Everything is injected through setQuizDepsForTests() — no Postgres, no
 * JWT. requireRole is mocked. Covers: XP summary + offer eligibility, the
 * pool-protection gate at start time, the render-safe leak discipline on
 * quiz items, grading via the same attempt path, timer edge cases (late
 * flag, unanswered→skipped), and double-submit idempotency.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerResponse } from 'http';
import { InMemoryCatalog } from '../../scoring/learning-object-catalog';
import type { Attempt, LearningObject, StudentModel, MasteryState, DueReviewCandidate } from '../../core/interfaces';
import { QUIZ_LENGTH, QUIZ_SECONDS_PER_ITEM } from '../../scoring/xp';

const mockRequireRole = vi.fn();
vi.mock('../auth-middleware', () => ({
  requireRole: (...args: any[]) => mockRequireRole(...args),
}));

const { quizRoutes, setQuizDepsForTests } = await import('../quiz-routes');

const summaryHandler = quizRoutes.find((r) => r.method === 'GET' && r.path === '/api/practice/xp/summary')!.handler;
const startHandler = quizRoutes.find((r) => r.method === 'POST' && r.path === '/api/practice/quiz/start')!.handler;
const submitHandler = quizRoutes.find((r) => r.method === 'POST' && r.path === '/api/practice/quiz/:id/submit')!.handler;

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

function mcqItem(id: string, skillId: string, estMinutes = 3): LearningObject {
  return {
    id, nodeId: skillId, type: 'practice', difficulty: 1500, estMinutes, prereqs: [], verification: 'cas_passed',
    payload: {
      skillId, topic: skillId, questionText: `Q for ${id}`,
      questionType: 'mcq', marks: 2, options: ['a', 'b', 'c', 'd'], answerIndex: 1,
      correctAnswer: 'b', solutionSteps: ['step'],
    },
  };
}

function makeFakeQuizStore() {
  const sessions = new Map<string, any>();
  return {
    createQuizSession: async (params: any) => {
      const row = {
        id: params.id, studentId: params.studentId, itemIds: params.itemIds, status: 'in_progress',
        startedAtMs: params.startedAtMs, deadlineAtMs: params.deadlineAtMs,
        submittedAtMs: null, gradedAtMs: null, late: false, score: null, maxMarks: null, result: null,
      };
      sessions.set(params.id, row);
      return { ...row };
    },
    getQuizSession: async (id: string) => (sessions.has(id) ? { ...sessions.get(id) } : null),
    claimSubmission: async (id: string, nowMs: number) => {
      const row = sessions.get(id);
      if (!row) return null;
      if (row.status === 'in_progress') {
        row.status = 'submitted';
        row.submittedAtMs = nowMs;
        return { fresh: true, row: { ...row } };
      }
      return { fresh: false, row: { ...row } };
    },
    finalizeQuizSubmission: async (id: string, outcome: any) => {
      const row = sessions.get(id);
      Object.assign(row, { late: outcome.late, score: outcome.score, maxMarks: outcome.maxMarks, result: outcome.result, gradedAtMs: outcome.gradedAtMs });
      return { ...row };
    },
    sessions,
  };
}

function fakeStudentModel(updates: Attempt[], masteryOverride?: Map<string, MasteryState>): StudentModel & { masteryStates: any } {
  return {
    abilityFor: async () => ({ studentId: 's', skillId: 'k', rating: 1500, n: 0 } as any),
    retrievability: async () => 0,
    masteryState: async () => 'practicing' as MasteryState,
    masteryStates: async (_studentId: string, skillIds: readonly string[]) => {
      const m = new Map<string, MasteryState>();
      for (const id of skillIds) m.set(id, masteryOverride?.get(id) ?? 'practicing');
      return m;
    },
    errorProfile: async () => ({} as any),
    update: async (a: Attempt) => { updates.push(a); },
  };
}

const NOW = new Date('2026-08-18T10:00:00.000Z');

describe('GET /api/practice/xp/summary', () => {
  beforeEach(() => {
    mockRequireRole.mockReset();
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
  });
  afterEach(() => setQuizDepsForTests(null));

  it('reports total minutes + threshold + not-eligible below the 2x pool gate', async () => {
    const catalog = new InMemoryCatalog([mcqItem('a', 'eigenvalues')]);
    setQuizDepsForTests({
      catalog: () => catalog,
      studentModel: () => fakeStudentModel([], new Map()),
      totalXpMinutes: async () => 64,
      dueCards: async () => [],
      recentlyReviewed: async () => new Set(),
      now: () => NOW,
    });
    const r = makeRes();
    await summaryHandler(makeReq(null), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.total_minutes).toBe(64);
    expect(r.payload.threshold_minutes).toBe(100);
    expect(r.payload.quiz_offer.eligible).toBe(false);
    expect(r.payload.quiz_offer.reason).toMatch(/practise more/i);
  });

  it('reports eligible once due+frontier pool reaches 2x the quiz length', async () => {
    // Frontier pulls up to 3 items PER touched concept — spread across
    // several concepts (like the real 26-concept LA catalog) rather than
    // relying on one concept alone to clear the 2x gate.
    const concepts = ['eigenvalues', 'determinants', 'orthogonality', 'linear-transformations', 'rank-nullity'];
    const items = concepts.flatMap((c, ci) => [0, 1, 2].map((j) => mcqItem(`f${ci}-${j}`, c)));
    const catalog = new InMemoryCatalog(items);
    const masteryMap = new Map(concepts.map((c) => [c, 'practicing' as const]));
    setQuizDepsForTests({
      catalog: () => catalog,
      studentModel: () => fakeStudentModel([], masteryMap),
      totalXpMinutes: async () => 100,
      dueCards: async () => [],
      recentlyReviewed: async () => new Set(),
      now: () => NOW,
    });
    const r = makeRes();
    await summaryHandler(makeReq(null), r.res);
    expect(r.payload.quiz_offer.eligible).toBe(true);
    expect(r.payload.quiz_offer.quiz_length).toBe(QUIZ_LENGTH);
  });
});

describe('POST /api/practice/quiz/start', () => {
  beforeEach(() => {
    mockRequireRole.mockReset();
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
  });
  afterEach(() => setQuizDepsForTests(null));

  const POOL_CONCEPTS = ['eigenvalues', 'determinants', 'orthogonality', 'linear-transformations', 'rank-nullity'];

  function bigPoolDeps(store = makeFakeQuizStore(), ids = 'p') {
    const items = POOL_CONCEPTS.flatMap((c, ci) => [0, 1, 2].map((j) => mcqItem(`${ids}${ci}-${j}`, c)));
    const catalog = new InMemoryCatalog(items);
    const masteryMap = new Map(POOL_CONCEPTS.map((c) => [c, 'practicing' as const]));
    return {
      catalog: () => catalog,
      studentModel: () => fakeStudentModel([], masteryMap),
      dueCards: async () => [] as DueReviewCandidate[],
      recentlyReviewed: async () => new Set<string>(),
      now: () => NOW,
      rng: () => 0.42,
      newQuizId: () => 'quiz-1',
      createQuizSession: store.createQuizSession,
      getQuizSession: store.getQuizSession,
      claimSubmission: store.claimSubmission,
      finalizeQuizSubmission: store.finalizeQuizSubmission,
      store,
    };
  }

  it('refuses with 422 below the pool-depth gate — never pads a quiz', async () => {
    setQuizDepsForTests({
      catalog: () => new InMemoryCatalog([mcqItem('a', 'eigenvalues')]),
      studentModel: () => fakeStudentModel([], new Map()),
      dueCards: async () => [],
      recentlyReviewed: async () => new Set(),
      now: () => NOW,
    });
    const r = makeRes();
    await startHandler(makeReq({}), r.res);
    expect(r.status).toBe(422);
  });

  it('starts a quiz with QUIZ_LENGTH items, an 80s/item deadline, and no leaked answer key', async () => {
    setQuizDepsForTests(bigPoolDeps());
    const r = makeRes();
    await startHandler(makeReq({}), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.quiz_id).toBe('quiz-1');
    expect(r.payload.items).toHaveLength(QUIZ_LENGTH);
    expect(r.payload.time_budget_sec).toBe(QUIZ_LENGTH * QUIZ_SECONDS_PER_ITEM);

    const raw = JSON.stringify(r.payload);
    expect(raw).not.toContain('answerIndex');
    expect(raw).not.toContain('answer_index');
    expect(raw).not.toContain('correctAnswer');
    expect(raw).not.toContain('correct_answer');
    expect(raw).not.toContain('solutionSteps');
    expect(raw).not.toContain('distractors');
    expect(raw).not.toContain('answerRange');
  });

  it('excludes items reviewed within the 14-day no-repeat window (pool shrinks below gate → 422)', async () => {
    const items = POOL_CONCEPTS.flatMap((c, ci) => [0, 1, 2].map((j) => mcqItem(`r${ci}-${j}`, c)));
    const catalog = new InMemoryCatalog(items);
    const masteryMap = new Map(POOL_CONCEPTS.map((c) => [c, 'practicing' as const]));
    setQuizDepsForTests({
      catalog: () => catalog,
      studentModel: () => fakeStudentModel([], masteryMap),
      dueCards: async () => [],
      recentlyReviewed: async () => new Set(items.map((i) => i.id)), // everything recently seen
      now: () => NOW,
    });
    const r = makeRes();
    await startHandler(makeReq({}), r.res);
    expect(r.status).toBe(422);
  });
});

describe('POST /api/practice/quiz/:id/submit', () => {
  beforeEach(() => {
    mockRequireRole.mockReset();
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
  });
  afterEach(() => setQuizDepsForTests(null));

  async function startedQuiz(itemCount = QUIZ_LENGTH) {
    const items = Array.from({ length: itemCount }, (_, i) => mcqItem(`i${i}`, 'eigenvalues'));
    const catalog = new InMemoryCatalog(items);
    const store = makeFakeQuizStore();
    const updates: Attempt[] = [];
    const xpAwards: any[] = [];
    const startedAtMs = NOW.getTime();
    await store.createQuizSession({
      id: 'quiz-x', studentId: 'student-1', itemIds: items.map((i) => i.id),
      startedAtMs, deadlineAtMs: startedAtMs + itemCount * QUIZ_SECONDS_PER_ITEM * 1000,
    });
    const deps = {
      catalog: () => catalog,
      studentModel: () => fakeStudentModel(updates),
      dueCards: async () => [],
      recentlyReviewed: async () => new Set<string>(),
      awardXp: async (a: any) => { xpAwards.push(a); },
      recordProblemAttempt: async () => {},
      createQuizSession: store.createQuizSession,
      getQuizSession: store.getQuizSession,
      claimSubmission: store.claimSubmission,
      finalizeQuizSubmission: store.finalizeQuizSubmission,
    };
    return { items, updates, xpAwards, deps, startedAtMs };
  }

  it('grades every item via the deterministic scorer and feeds StudentModel.update with a fixed per-item ts', async () => {
    const { items, updates, deps, startedAtMs } = await startedQuiz();
    setQuizDepsForTests({ ...deps, now: () => NOW });
    const responses = items.map((it, i) => ({ object_id: it.id, selectedIndex: i === 0 ? 1 : 0 })); // item 0 correct, rest wrong
    const r = makeRes();
    await submitHandler(makeReq({ responses }, { id: 'quiz-x' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.correct).toBe(1);
    expect(r.payload.late).toBe(false);
    expect(updates).toHaveLength(items.length);
    expect(updates[0]).toMatchObject({ studentId: 'student-1', objectId: 'i0', ts: startedAtMs + 0 });
    expect(updates[1]).toMatchObject({ objectId: 'i1', ts: startedAtMs + 1 });
  });

  it('treats an unanswered item as skipped, not refused', async () => {
    const { items, updates, deps } = await startedQuiz();
    setQuizDepsForTests({ ...deps, now: () => NOW });
    const responses = [{ object_id: items[0].id, selectedIndex: 1 }]; // only answer the first
    const r = makeRes();
    await submitHandler(makeReq({ responses }, { id: 'quiz-x' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.skipped).toBe(items.length - 1);
    // Skipped items never reach StudentModel.update (mirrors the practice-attempt contract).
    expect(updates).toHaveLength(1);
  });

  it('flags a late submission but still grades it fully (no bonus either way)', async () => {
    const { items, deps, startedAtMs } = await startedQuiz();
    const late = new Date(startedAtMs + (items.length * QUIZ_SECONDS_PER_ITEM + 60) * 1000);
    setQuizDepsForTests({ ...deps, now: () => late });
    const responses = items.map((it) => ({ object_id: it.id, selectedIndex: 1 }));
    const r = makeRes();
    await submitHandler(makeReq({ responses }, { id: 'quiz-x' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.late).toBe(true);
    expect(r.payload.correct).toBe(items.length); // still fully graded
  });

  it('double-submit is idempotent — the second call replays the persisted result, never re-grades', async () => {
    const { items, updates, deps } = await startedQuiz();
    setQuizDepsForTests({ ...deps, now: () => NOW });
    const responses = items.map((it, i) => ({ object_id: it.id, selectedIndex: i === 0 ? 1 : 0 }));

    const first = makeRes();
    await submitHandler(makeReq({ responses }, { id: 'quiz-x' }), first.res);
    expect(updates).toHaveLength(items.length);

    // Second call sends DIFFERENT (bogus) responses — must NOT change the outcome.
    const second = makeRes();
    await submitHandler(makeReq({ responses: [{ object_id: items[0].id, selectedIndex: 0 }] }, { id: 'quiz-x' }), second.res);
    expect(second.status).toBe(200);
    expect(second.payload.correct).toBe(first.payload.correct);
    expect(second.payload.earned).toBe(first.payload.earned);
    expect(second.payload.replayed).toBe(true);
    // No additional StudentModel.update calls on replay.
    expect(updates).toHaveLength(items.length);
  });

  it('404s an unknown quiz id', async () => {
    const { deps } = await startedQuiz();
    setQuizDepsForTests({ ...deps, now: () => NOW });
    const r = makeRes();
    await submitHandler(makeReq({ responses: [] }, { id: 'does-not-exist' }), r.res);
    expect(r.status).toBe(404);
  });

  it('404s a quiz owned by a different student — never leaks another student\'s session', async () => {
    const { deps } = await startedQuiz();
    setQuizDepsForTests({ ...deps, now: () => NOW });
    mockRequireRole.mockResolvedValue({ userId: 'someone-else', role: 'student' });
    const r = makeRes();
    await submitHandler(makeReq({ responses: [] }, { id: 'quiz-x' }), r.res);
    expect(r.status).toBe(404);
  });
});
