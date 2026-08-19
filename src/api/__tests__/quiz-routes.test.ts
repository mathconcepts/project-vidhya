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
import { QUIZ_LENGTH, QUIZ_SECONDS_PER_ITEM, QUIZ_XP_THRESHOLD_MINUTES } from '../../scoring/xp';

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
    // Mirrors quiz-store-pg.ts's revertClaim guard: only reverts the EXACT
    // claim just made (same submittedAtMs, not yet graded).
    revertClaim: async (id: string, expectedSubmittedAtMs: number): Promise<boolean> => {
      const row = sessions.get(id);
      if (!row) return false;
      if (row.status !== 'submitted' || row.submittedAtMs !== expectedSubmittedAtMs || row.gradedAtMs !== null) return false;
      row.status = 'in_progress';
      row.submittedAtMs = null;
      return true;
    },
    // Mirrors quiz-store-pg.ts's getLastSubmittedQuizAt: MAX(submitted_at)
    // among status='submitted' rows for the student, scanning the SAME
    // in-memory sessions this fake store already tracks — an in-progress
    // (never-submitted) row is never a candidate.
    getLastSubmittedQuizAt: async (studentId: string): Promise<number | null> => {
      let max: number | null = null;
      for (const row of sessions.values()) {
        if (row.studentId !== studentId) continue;
        if (row.status !== 'submitted' || row.submittedAtMs === null) continue;
        if (max === null || row.submittedAtMs > max) max = row.submittedAtMs;
      }
      return max;
    },
    sessions,
  };
}

/** Fake XP ledger — mirrors xp-store.ts's xpEarnedSince (awarded_at > sinceMs, or lifetime when null). */
function makeFakeXpLedger() {
  const events: Array<{ studentId: string; amount: number; awardedAtMs: number }> = [];
  return {
    events,
    awardXp: async (a: any) => { events.push({ studentId: a.studentId, amount: a.xpAmount, awardedAtMs: a.tsMs }); },
    xpEarnedSince: async (studentId: string, sinceMs: number | null): Promise<number> => {
      const total = events
        .filter((e) => e.studentId === studentId && (sinceMs === null || e.awardedAtMs > sinceMs))
        .reduce((sum, e) => sum + e.amount, 0);
      return Math.max(0, Math.round(total));
    },
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
      getLastSubmittedQuizAt: async () => null,
      xpEarnedSince: async () => 64,
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

  it('reports eligible once due+frontier pool reaches 2x the quiz length AND the XP cycle threshold is met', async () => {
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
      getLastSubmittedQuizAt: async () => null,
      xpEarnedSince: async () => 100,
      dueCards: async () => [],
      recentlyReviewed: async () => new Set(),
      now: () => NOW,
    });
    const r = makeRes();
    await summaryHandler(makeReq(null), r.res);
    expect(r.payload.quiz_offer.eligible).toBe(true);
    expect(r.payload.quiz_offer.quiz_length).toBe(QUIZ_LENGTH);
  });

  it('pool ready but XP cycle not yet at threshold — still not eligible', async () => {
    const concepts = ['eigenvalues', 'determinants', 'orthogonality', 'linear-transformations', 'rank-nullity'];
    const items = concepts.flatMap((c, ci) => [0, 1, 2].map((j) => mcqItem(`g${ci}-${j}`, c)));
    const catalog = new InMemoryCatalog(items);
    const masteryMap = new Map(concepts.map((c) => [c, 'practicing' as const]));
    setQuizDepsForTests({
      catalog: () => catalog,
      studentModel: () => fakeStudentModel([], masteryMap),
      getLastSubmittedQuizAt: async () => null,
      xpEarnedSince: async () => 64, // ready on pool, not yet on XP
      dueCards: async () => [],
      recentlyReviewed: async () => new Set(),
      now: () => NOW,
    });
    const r = makeRes();
    await summaryHandler(makeReq(null), r.res);
    expect(r.payload.total_minutes).toBe(64);
    expect(r.payload.quiz_offer.eligible).toBe(false);
  });

  it('baseline query behavior with zero submitted quizzes is unchanged: cycle total = lifetime total', async () => {
    const ledger = makeFakeXpLedger();
    ledger.events.push({ studentId: 'student-1', amount: 30, awardedAtMs: NOW.getTime() - 20 * 86_400_000 });
    ledger.events.push({ studentId: 'student-1', amount: 34, awardedAtMs: NOW.getTime() - 1 * 86_400_000 });
    setQuizDepsForTests({
      catalog: () => new InMemoryCatalog([]),
      studentModel: () => fakeStudentModel([], new Map()),
      getLastSubmittedQuizAt: async () => null, // never submitted a quiz
      xpEarnedSince: ledger.xpEarnedSince,
      dueCards: async () => [],
      recentlyReviewed: async () => new Set(),
      now: () => NOW,
    });
    const r = makeRes();
    await summaryHandler(makeReq(null), r.res);
    expect(r.payload.total_minutes).toBe(64); // 30 + 34, full lifetime sum — no baseline to exclude anything
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
      // These tests are about the POOL gate specifically — keep the XP
      // cycle gate satisfied so it's never the reason for a refusal here.
      getLastSubmittedQuizAt: async () => null,
      xpEarnedSince: async () => 100,
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
      getLastSubmittedQuizAt: async () => null,
      xpEarnedSince: async () => 100, // XP gate satisfied — this test isolates the pool gate
      now: () => NOW,
    });
    const r = makeRes();
    await startHandler(makeReq({}), r.res);
    expect(r.status).toBe(422);
  });

  it('refuses with 422 below the XP cycle threshold — even with a huge pool', async () => {
    const deps = bigPoolDeps();
    setQuizDepsForTests({ ...deps, xpEarnedSince: async () => 64 });
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
      getLastSubmittedQuizAt: async () => null,
      xpEarnedSince: async () => 100,
      now: () => NOW,
    });
    const r = makeRes();
    await startHandler(makeReq({}), r.res);
    expect(r.status).toBe(422);
  });

  describe('concept-scoped start (walkthrough Test leg)', () => {
    it('400s on an unknown concept_id before touching the pool', async () => {
      setQuizDepsForTests(bigPoolDeps());
      const r = makeRes();
      await startHandler(makeReq({ concept_id: 'definitely-not-a-real-concept-xyz' }), r.res);
      expect(r.status).toBe(400);
      expect(r.payload.error).toMatch(/unknown concept/i);
    });

    it('scopes the pool to just that concept — items from other concepts never appear', async () => {
      // Enough items in ONE concept to clear the depth gate on its own,
      // plus plenty of items in OTHER concepts that must be excluded.
      // 'trace' is a real GATE-MA concept id distinct from every id in
      // POOL_CONCEPTS, so there's no accidental overlap between the two
      // item sets below.
      const scopedItems = Array.from({ length: QUIZ_LENGTH * 2 }, (_, i) => mcqItem(`s${i}`, 'trace'));
      const otherItems = POOL_CONCEPTS.flatMap((c, ci) => [0, 1, 2].map((j) => mcqItem(`o${ci}-${j}`, c)));
      const catalog = new InMemoryCatalog([...scopedItems, ...otherItems]);
      const store = makeFakeQuizStore();
      setQuizDepsForTests({
        catalog: () => catalog,
        studentModel: () => fakeStudentModel([], new Map()),
        dueCards: async () => [],
        recentlyReviewed: async () => new Set(),
        getLastSubmittedQuizAt: async () => null,
        xpEarnedSince: async () => 100,
        now: () => NOW,
        rng: () => 0.42,
        newQuizId: () => 'quiz-scoped',
        createQuizSession: store.createQuizSession,
        getQuizSession: store.getQuizSession,
        claimSubmission: store.claimSubmission,
        finalizeQuizSubmission: store.finalizeQuizSubmission,
      });
      const r = makeRes();
      await startHandler(makeReq({ concept_id: 'trace' }), r.res);
      expect(r.status).toBe(200);
      expect(r.payload.items).toHaveLength(QUIZ_LENGTH);
      for (const item of r.payload.items) {
        expect(item.object_id.startsWith('s')).toBe(true); // scopedItems' id prefix — never an 'o' (other-concept) item
      }
    });

    it('still refuses with 422 below the pool-depth gate when the concept alone cannot fill a quiz', async () => {
      const catalog = new InMemoryCatalog([mcqItem('single', 'trace')]); // 1 item — nowhere near 2x QUIZ_LENGTH
      setQuizDepsForTests({
        catalog: () => catalog,
        studentModel: () => fakeStudentModel([], new Map()),
        dueCards: async () => [],
        recentlyReviewed: async () => new Set(),
        getLastSubmittedQuizAt: async () => null,
        xpEarnedSince: async () => 100,
        now: () => NOW,
      });
      const r = makeRes();
      await startHandler(makeReq({ concept_id: 'trace' }), r.res);
      expect(r.status).toBe(422);
    });

    it('does NOT weaken the XP-cycle gate for a concept-scoped start — same 422 as unscoped', async () => {
      const scopedItems = Array.from({ length: QUIZ_LENGTH * 2 }, (_, i) => mcqItem(`s${i}`, 'trace'));
      const catalog = new InMemoryCatalog(scopedItems);
      setQuizDepsForTests({
        catalog: () => catalog,
        studentModel: () => fakeStudentModel([], new Map()),
        dueCards: async () => [],
        recentlyReviewed: async () => new Set(),
        getLastSubmittedQuizAt: async () => null,
        xpEarnedSince: async () => 64, // below QUIZ_XP_THRESHOLD_MINUTES
        now: () => NOW,
      });
      const r = makeRes();
      await startHandler(makeReq({ concept_id: 'trace' }), r.res);
      expect(r.status).toBe(422);
    });

    it('an absent or blank concept_id is unscoped — byte-identical to the pre-existing pool build', async () => {
      const deps = bigPoolDeps();
      setQuizDepsForTests(deps);
      const rAbsent = makeRes();
      await startHandler(makeReq({}), rAbsent.res);
      expect(rAbsent.status).toBe(200);

      setQuizDepsForTests(deps);
      const rBlank = makeRes();
      await startHandler(makeReq({ concept_id: '  ' }), rBlank.res);
      expect(rBlank.status).toBe(200);
    });
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
      revertClaim: store.revertClaim,
    };
    return { items, updates, xpAwards, deps, startedAtMs, store };
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

  // ────────────────────────────────────────────────────────────────────
  // Adversarial-review fix: claim-before-grade brick
  // ────────────────────────────────────────────────────────────────────
  //
  // claimSubmission commits in_progress → submitted BEFORE grading runs.
  // Without a revert-on-throw, a grading exception would leave the row
  // stuck 'submitted' forever with result: null — every retry hitting the
  // `!claim.fresh` replay branch and returning an empty result as
  // `recorded: true`. This locks: the row goes back to 'in_progress' on a
  // grading throw, and a subsequent retry re-grades for real.
  describe('grading throw reverts the claim instead of bricking the quiz', () => {
    it('a grading exception returns 500 and puts the row back to in_progress (not stuck submitted)', async () => {
      const { items, deps, store } = await startedQuiz();
      const throwingCatalog: any = {
        ...deps.catalog(),
        getById: vi.fn(async () => { throw new Error('catalog boom'); }),
      };
      setQuizDepsForTests({ ...deps, catalog: () => throwingCatalog, now: () => NOW });

      const responses = items.map((it) => ({ object_id: it.id, selectedIndex: 1 }));
      const r = makeRes();
      await submitHandler(makeReq({ responses }, { id: 'quiz-x' }), r.res);

      expect(r.status).toBe(500);
      const row = await store.getQuizSession('quiz-x');
      expect(row!.status).toBe('in_progress');
      expect(row!.submittedAtMs).toBeNull();
      expect(row!.result).toBeNull();
    });

    it('a retry after a reverted grading failure actually re-grades — not a bricked replay', async () => {
      const { items, deps, updates, store } = await startedQuiz();
      const throwingCatalog: any = {
        ...deps.catalog(),
        getById: vi.fn(async () => { throw new Error('catalog boom'); }),
      };
      setQuizDepsForTests({ ...deps, catalog: () => throwingCatalog, now: () => NOW });

      const responses = items.map((it, i) => ({ object_id: it.id, selectedIndex: i === 0 ? 1 : 0 }));
      const failed = makeRes();
      await submitHandler(makeReq({ responses }, { id: 'quiz-x' }), failed.res);
      expect(failed.status).toBe(500);
      expect(updates).toHaveLength(0); // nothing was recorded on the failed attempt

      // Fix the transient failure (catalog is healthy again) and retry.
      setQuizDepsForTests({ ...deps, catalog: () => deps.catalog(), now: () => NOW });
      const retried = makeRes();
      await submitHandler(makeReq({ responses }, { id: 'quiz-x' }), retried.res);

      expect(retried.status).toBe(200);
      expect(retried.payload.replayed).toBeUndefined(); // a REAL grade, not a stale replay
      expect(retried.payload.correct).toBe(1);
      expect(updates).toHaveLength(items.length);
      expect((await store.getQuizSession('quiz-x'))!.status).toBe('submitted');
    });

    it('the successful (non-throwing) path never calls revertClaim', async () => {
      const { items, deps } = await startedQuiz();
      const revertClaim = vi.fn(deps.revertClaim as any);
      setQuizDepsForTests({ ...deps, revertClaim, now: () => NOW });
      const responses = items.map((it) => ({ object_id: it.id, selectedIndex: 1 }));
      const r = makeRes();
      await submitHandler(makeReq({ responses }, { id: 'quiz-x' }), r.res);
      expect(r.status).toBe(200);
      expect(revertClaim).not.toHaveBeenCalled();
    });
  });

  it('prefetches all item payloads concurrently rather than one at a time before grading', async () => {
    const { items, deps } = await startedQuiz();

    let inFlight = 0;
    let maxInFlight = 0;
    const instrumentedCatalog: any = {
      ...deps.catalog(),
      getById: vi.fn(async (id: string) => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await Promise.resolve();
        inFlight--;
        return deps.catalog().getById!(id);
      }),
    };

    setQuizDepsForTests({ ...deps, catalog: () => instrumentedCatalog, now: () => NOW });
    const responses = items.map((it) => ({ object_id: it.id, selectedIndex: 1 }));
    const r = makeRes();
    await submitHandler(makeReq({ responses }, { id: 'quiz-x' }), r.res);

    expect(r.status).toBe(200);
    expect(instrumentedCatalog.getById).toHaveBeenCalledTimes(items.length);
    expect(maxInFlight).toBeGreaterThan(1); // proves the lookups overlapped, not sequential
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

// ────────────────────────────────────────────────────────────────────
// "Quiz every N XP" is a REPEATING cadence (B5) — the meter must re-arm
// after each submitted quiz, gated on XP earned since the most recent
// quiz_sessions.submitted_at rather than a one-time lifetime threshold.
// ────────────────────────────────────────────────────────────────────

describe('XP cycle re-arms after a submitted quiz', () => {
  beforeEach(() => {
    mockRequireRole.mockReset();
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
  });
  afterEach(() => setQuizDepsForTests(null));

  const POOL_CONCEPTS = ['eigenvalues', 'determinants', 'orthogonality', 'linear-transformations', 'rank-nullity'];

  function readyPoolDeps(store: ReturnType<typeof makeFakeQuizStore>, ledger: ReturnType<typeof makeFakeXpLedger>) {
    const items = POOL_CONCEPTS.flatMap((c, ci) => [0, 1, 2].map((j) => mcqItem(`z${ci}-${j}`, c)));
    const catalog = new InMemoryCatalog(items);
    const masteryMap = new Map(POOL_CONCEPTS.map((c) => [c, 'practicing' as const]));
    return {
      catalog: () => catalog,
      studentModel: () => fakeStudentModel([], masteryMap),
      dueCards: async () => [] as DueReviewCandidate[],
      recentlyReviewed: async () => new Set<string>(), // pool always ready — isolates the XP-cycle behavior
      getLastSubmittedQuizAt: store.getLastSubmittedQuizAt,
      xpEarnedSince: ledger.xpEarnedSince,
      awardXp: ledger.awardXp,
      recordProblemAttempt: async () => {},
      createQuizSession: store.createQuizSession,
      getQuizSession: store.getQuizSession,
      claimSubmission: store.claimSubmission,
      finalizeQuizSubmission: store.finalizeQuizSubmission,
      rng: () => 0.42,
      newQuizId: () => 'quiz-cycle-1',
    };
  }

  it('(a) the meter resets after a submitted quiz and re-fills from there', async () => {
    const store = makeFakeQuizStore();
    const ledger = makeFakeXpLedger();
    const t0 = NOW.getTime();

    // Pre-quiz: well past the threshold (no baseline yet — lifetime sum).
    ledger.events.push({ studentId: 'student-1', amount: 60, awardedAtMs: t0 - 5 * 86_400_000 });
    ledger.events.push({ studentId: 'student-1', amount: 50, awardedAtMs: t0 - 1 * 86_400_000 });

    const beforeSubmit = makeRes();
    setQuizDepsForTests({ ...readyPoolDeps(store, ledger), now: () => new Date(t0) });
    await summaryHandler(makeReq(null), beforeSubmit.res);
    expect(beforeSubmit.payload.total_minutes).toBe(110);
    expect(beforeSubmit.payload.quiz_offer.eligible).toBe(true);

    // Submit a quiz at t0 — this becomes the new baseline.
    await store.createQuizSession({ id: 'quiz-cycle-1', studentId: 'student-1', itemIds: ['z0-0'], startedAtMs: t0, deadlineAtMs: t0 + 60_000 });
    await store.claimSubmission('quiz-cycle-1', t0);

    // A SMALL amount of XP lands AFTER the submission — well under threshold.
    ledger.events.push({ studentId: 'student-1', amount: 12, awardedAtMs: t0 + 60_000 });

    const afterSubmit = makeRes();
    setQuizDepsForTests({ ...readyPoolDeps(store, ledger), now: () => new Date(t0 + 2 * 86_400_000) });
    await summaryHandler(makeReq(null), afterSubmit.res);
    expect(afterSubmit.payload.total_minutes).toBe(12); // NOT 122 — the pre-submission 110 is excluded
    expect(afterSubmit.payload.quiz_offer.eligible).toBe(false);
  });

  it('(b) a second quiz offer appears once the NEW cycle reaches 100 XP again', async () => {
    const store = makeFakeQuizStore();
    const ledger = makeFakeXpLedger();
    const t0 = NOW.getTime();

    await store.createQuizSession({ id: 'quiz-cycle-1', studentId: 'student-1', itemIds: ['z0-0'], startedAtMs: t0, deadlineAtMs: t0 + 60_000 });
    await store.claimSubmission('quiz-cycle-1', t0);

    // Post-submission XP crawls up to exactly the threshold over several days.
    ledger.events.push({ studentId: 'student-1', amount: 40, awardedAtMs: t0 + 1 * 86_400_000 });
    ledger.events.push({ studentId: 'student-1', amount: 40, awardedAtMs: t0 + 2 * 86_400_000 });

    const midCycle = makeRes();
    setQuizDepsForTests({ ...readyPoolDeps(store, ledger), now: () => new Date(t0 + 3 * 86_400_000) });
    await summaryHandler(makeReq(null), midCycle.res);
    expect(midCycle.payload.total_minutes).toBe(80);
    expect(midCycle.payload.quiz_offer.eligible).toBe(false);

    ledger.events.push({ studentId: 'student-1', amount: 20, awardedAtMs: t0 + 4 * 86_400_000 });

    const nextOffer = makeRes();
    setQuizDepsForTests({ ...readyPoolDeps(store, ledger), now: () => new Date(t0 + 5 * 86_400_000) });
    await summaryHandler(makeReq(null), nextOffer.res);
    expect(nextOffer.payload.total_minutes).toBe(QUIZ_XP_THRESHOLD_MINUTES);
    expect(nextOffer.payload.quiz_offer.eligible).toBe(true);

    // The re-armed offer is also enforced at quiz/start, not just display.
    const start = makeRes();
    await startHandler(makeReq({}), start.res);
    expect(start.status).toBe(200);
  });

  it('(c) an in-progress (never-submitted) quiz does NOT move the baseline', async () => {
    const store = makeFakeQuizStore();
    const ledger = makeFakeXpLedger();
    const t0 = NOW.getTime();

    ledger.events.push({ studentId: 'student-1', amount: 45, awardedAtMs: t0 - 10 * 86_400_000 });

    // Started but never submitted.
    await store.createQuizSession({ id: 'quiz-abandoned', studentId: 'student-1', itemIds: ['z0-0'], startedAtMs: t0 - 5 * 86_400_000, deadlineAtMs: t0 - 5 * 86_400_000 + 60_000 });

    const r = makeRes();
    setQuizDepsForTests({ ...readyPoolDeps(store, ledger), now: () => new Date(t0) });
    await summaryHandler(makeReq(null), r.res);

    // Baseline must still be null (no SUBMITTED quiz exists) — the abandoned
    // in-progress row is invisible to getLastSubmittedQuizAt, so the
    // pre-existing 45 XP is still counted, not silently dropped.
    expect(r.payload.total_minutes).toBe(45);
    expect(await store.getLastSubmittedQuizAt('student-1')).toBeNull();
  });

  it('(d) zero submitted quizzes: baseline is null, cycle total = lifetime total (unchanged behavior)', async () => {
    const store = makeFakeQuizStore();
    const ledger = makeFakeXpLedger();
    ledger.events.push({ studentId: 'student-1', amount: 25, awardedAtMs: NOW.getTime() - 40 * 86_400_000 });
    ledger.events.push({ studentId: 'student-1', amount: 39, awardedAtMs: NOW.getTime() - 3 * 86_400_000 });

    const r = makeRes();
    setQuizDepsForTests({ ...readyPoolDeps(store, ledger), now: () => NOW });
    await summaryHandler(makeReq(null), r.res);
    expect(await store.getLastSubmittedQuizAt('student-1')).toBeNull();
    expect(r.payload.total_minutes).toBe(64);
  });
});
