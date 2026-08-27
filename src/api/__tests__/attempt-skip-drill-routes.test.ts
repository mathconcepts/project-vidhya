/**
 * Tests for src/api/attempt-skip-drill-routes.ts — plan W3.2's drill.
 *
 * Everything runs through setAttemptSkipDrillDepsForTests() — no Postgres,
 * no JWT. Covers the D8 refusal literal, the DB-less honesty, the leak
 * discipline on the served items, and both sides of the skip verdict
 * (including the honest "no rating yet" third state).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerResponse } from 'http';
import type { LearningObject } from '../../core/interfaces';

const mockRequireRole = vi.fn();
vi.mock('../auth-middleware', () => ({
  requireRole: (...args: any[]) => mockRequireRole(...args),
}));

const {
  attemptSkipDrillRoutes,
  setAttemptSkipDrillDepsForTests,
  notEnoughItemsMessage,
  breakEvenSentence,
  skipReason,
  DRILL_LENGTH,
} = await import('../attempt-skip-drill-routes');

const drillHandler = attemptSkipDrillRoutes
  .find((r) => r.method === 'GET' && r.path === '/api/practice/attempt-skip-drill')!.handler;
const skipHandler = attemptSkipDrillRoutes
  .find((r) => r.method === 'POST' && r.path === '/api/practice/attempt-skip-drill/skip')!.handler;

function makeReq(body: unknown = null, query: Record<string, string> = {}) {
  return { pathname: '/', query: new URLSearchParams(query), params: {}, body, headers: {} } as any;
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

const CONCEPT = 'determinants';

function mcqItem(id: string, marks = 2): LearningObject {
  return {
    id, nodeId: CONCEPT, type: 'practice', difficulty: 1500, estMinutes: 3,
    prereqs: [], verification: 'cas_passed',
    payload: {
      topic: 'linear-algebra',
      questionText: `Question ${id}`,
      questionType: 'mcq',
      marks,
      options: ['a', 'b', 'c', 'd'],
      answerIndex: 2,
      solutionSteps: ['step'],
    },
  };
}

function natItem(id: string, marks = 1): LearningObject {
  return {
    id, nodeId: CONCEPT, type: 'practice', difficulty: 1500, estMinutes: 3,
    prereqs: [], verification: 'cas_passed',
    payload: { questionText: `NAT ${id}`, questionType: 'nat', marks, answerRange: [1, 1] },
  };
}

/** An item migration 032/033 never marked — renders, cannot be graded. */
function unmarkedItem(id: string): LearningObject {
  return {
    id, nodeId: CONCEPT, type: 'practice', difficulty: 1500, estMinutes: 3,
    prereqs: [], verification: 'cas_passed',
    payload: { questionText: `Unmarked ${id}` },
  };
}

function catalogOf(items: LearningObject[]) {
  return {
    query: async () => items,
    getById: async (id: string) => items.find((i) => i.id === id) ?? null,
  };
}

function abilityModel(n: number, rating = 1500) {
  return {
    abilityFor: async () => ({ rating, confidence: 0.5, n }),
    masteryState: async () => 'practising' as const,
    retrievability: async () => 0.5,
    errorProfile: async () => ({ weights: {} }),
    update: async () => {},
  };
}

beforeEach(() => {
  mockRequireRole.mockReset();
  mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
});
afterEach(() => setAttemptSkipDrillDepsForTests(null));

describe('GET /api/practice/attempt-skip-drill', () => {
  it('requires auth', async () => {
    mockRequireRole.mockResolvedValue(null);
    const r = makeRes();
    await drillHandler(makeReq(null, { concept_id: CONCEPT }), r.res);
    expect(r.payload).toBeNull();
  });

  it('names a missing concept_id', async () => {
    const r = makeRes();
    await drillHandler(makeReq(null, {}), r.res);
    expect(r.status).toBe(400);
    expect(r.payload.error).toBe('concept_id is required');
  });

  it('names an unknown concept rather than serving an empty drill', async () => {
    const r = makeRes();
    await drillHandler(makeReq(null, { concept_id: 'not-a-concept' }), r.res);
    expect(r.status).toBe(400);
    expect(r.payload.error).toBe('unknown concept: not-a-concept');
  });

  it('DB-less refuses with the readiness routes\' "building your baseline" honesty', async () => {
    setAttemptSkipDrillDepsForTests({ hasDatabase: () => false });
    const r = makeRes();
    await drillHandler(makeReq(null, { concept_id: CONCEPT }), r.res);
    expect(r.status).toBe(503);
    expect(r.payload.error).toContain('building your baseline');
  });

  it('serves exactly DRILL_LENGTH items with marking and a break-even sentence', async () => {
    const items = [mcqItem('a'), mcqItem('b'), mcqItem('c'), natItem('d'), mcqItem('e'), mcqItem('f')];
    setAttemptSkipDrillDepsForTests({
      hasDatabase: () => true, catalog: () => catalogOf(items) as any, rng: () => 0,
    });
    const r = makeRes();
    await drillHandler(makeReq(null, { concept_id: CONCEPT }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.concept_id).toBe(CONCEPT);
    expect(r.payload.items).toHaveLength(DRILL_LENGTH);
    for (const it of r.payload.items) {
      expect(it.marking).toHaveProperty('marks_correct');
      expect(it.marking).toHaveProperty('marks_wrong');
      expect(typeof it.break_even_sentence).toBe('string');
    }
  });

  it('never serves an answer key', async () => {
    const items = [mcqItem('a'), mcqItem('b'), mcqItem('c'), mcqItem('d'), natItem('e')];
    setAttemptSkipDrillDepsForTests({
      hasDatabase: () => true, catalog: () => catalogOf(items) as any, rng: () => 0,
    });
    const r = makeRes();
    await drillHandler(makeReq(null, { concept_id: CONCEPT }), r.res);
    const serialized = JSON.stringify(r.payload);
    expect(serialized).not.toContain('answerIndex');
    expect(serialized).not.toContain('answer_index');
    expect(serialized).not.toContain('answerRange');
    expect(serialized).not.toContain('answer_range');
    expect(serialized).not.toContain('correct_answer');
    expect(serialized).not.toContain('solutionSteps');
  });

  it('refuses below the floor with the D8 message naming the count and concept', async () => {
    setAttemptSkipDrillDepsForTests({
      hasDatabase: () => true,
      catalog: () => catalogOf([mcqItem('a'), mcqItem('b'), mcqItem('c')]) as any,
    });
    const r = makeRes();
    await drillHandler(makeReq(null, { concept_id: 'eigenvalues' }), r.res);
    expect(r.status).toBe(422);
    expect(r.payload.error).toBe("3 gradable items for 'eigenvalues', need 5");
  });

  it('counts gradability the way the runtime does — an unmarked item does not count', async () => {
    setAttemptSkipDrillDepsForTests({
      hasDatabase: () => true,
      catalog: () => catalogOf([
        mcqItem('a'), mcqItem('b'), mcqItem('c'), mcqItem('d'),
        unmarkedItem('u1'), unmarkedItem('u2'),
      ]) as any,
    });
    const r = makeRes();
    await drillHandler(makeReq(null, { concept_id: CONCEPT }), r.res);
    expect(r.status).toBe(422);
    expect(r.payload.error).toBe("4 gradable items for 'determinants', need 5");
  });

  it('a catalog failure is a 503, not an empty drill', async () => {
    setAttemptSkipDrillDepsForTests({
      hasDatabase: () => true,
      catalog: () => ({ query: async () => { throw new Error('boom'); } }) as any,
    });
    const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = makeRes();
    await drillHandler(makeReq(null, { concept_id: CONCEPT }), r.res);
    expect(r.status).toBe(503);
    consoleErr.mockRestore();
  });
});

describe('POST /api/practice/attempt-skip-drill/skip', () => {
  const items = [mcqItem('mcq-2', 2), natItem('nat-1', 1)];

  it('calls a skip WRONG when the student\'s accuracy clears break-even', async () => {
    setAttemptSkipDrillDepsForTests({
      catalog: () => catalogOf(items) as any,
      // 1700 → ~0.73 success share, well above the 25% break-even.
      studentModel: () => abilityModel(40, 1700) as any,
    });
    const r = makeRes();
    await skipHandler(makeReq({ object_id: 'mcq-2' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.verdict).toBe('should_have_attempted');
    expect(r.payload.expected_marks_if_attempted).toBeGreaterThan(0);
    expect(r.payload.reason).toContain('Worth attempting');
    expect(r.payload.reason).toContain('guaranteed zero');
  });

  it('calls a skip RIGHT when the student\'s accuracy is below break-even', async () => {
    setAttemptSkipDrillDepsForTests({
      catalog: () => catalogOf(items) as any,
      // 1150 → ~0.15 success share, below the 25% break-even for an MCQ.
      studentModel: () => abilityModel(40, 1150) as any,
    });
    const r = makeRes();
    await skipHandler(makeReq({ object_id: 'mcq-2' }), r.res);
    expect(r.payload.verdict).toBe('good_skip');
    expect(r.payload.expected_marks_if_attempted).toBeLessThan(0);
    expect(r.payload.reason).toContain('Right call');
  });

  it('withholds the verdict when the student has no graded attempts on the concept', async () => {
    setAttemptSkipDrillDepsForTests({
      catalog: () => catalogOf(items) as any,
      studentModel: () => abilityModel(0) as any,
    });
    const r = makeRes();
    await skipHandler(makeReq({ object_id: 'mcq-2' }), r.res);
    expect(r.payload.verdict).toBe('unknown');
    expect(r.payload.success_probability).toBeNull();
    expect(r.payload.expected_marks_if_attempted).toBeNull();
    expect(r.payload.reason).toContain('not answered enough questions');
    expect(r.payload.reason).toContain('25 in 100');
  });

  it('a NAT skip is always wrong — there is no penalty to weigh against', async () => {
    setAttemptSkipDrillDepsForTests({
      catalog: () => catalogOf(items) as any,
      studentModel: () => abilityModel(0) as any,
    });
    const r = makeRes();
    await skipHandler(makeReq({ object_id: 'nat-1' }), r.res);
    expect(r.payload.marking.marks_wrong).toBe(0);
    expect(r.payload.reason).toContain('never a reason to leave it blank');
  });

  it('404s an unknown item and 422s an ungradable one', async () => {
    setAttemptSkipDrillDepsForTests({
      catalog: () => catalogOf([...items, unmarkedItem('u1')]) as any,
      studentModel: () => abilityModel(10) as any,
    });
    const missing = makeRes();
    await skipHandler(makeReq({ object_id: 'nope' }), missing.res);
    expect(missing.status).toBe(404);

    const ungradable = makeRes();
    await skipHandler(makeReq({ object_id: 'u1' }), ungradable.res);
    expect(ungradable.status).toBe(422);
    expect(ungradable.payload.error).toContain('question_type');
  });

  it('requires an object_id', async () => {
    const r = makeRes();
    await skipHandler(makeReq({}), r.res);
    expect(r.status).toBe(400);
    expect(r.payload.error).toBe('object_id (string) is required');
  });

  it('never leaks the answer key back in the skip evaluation', async () => {
    setAttemptSkipDrillDepsForTests({
      catalog: () => catalogOf(items) as any,
      studentModel: () => abilityModel(10) as any,
    });
    const r = makeRes();
    await skipHandler(makeReq({ object_id: 'mcq-2' }), r.res);
    const serialized = JSON.stringify(r.payload);
    expect(serialized).not.toContain('answerIndex');
    expect(serialized).not.toContain('options');
  });
});

describe('locked copy', () => {
  it('the refusal names count, concept and requirement — the plan D8 literal', () => {
    expect(notEnoughItemsMessage(3, 'eigenvalues')).toBe("3 gradable items for 'eigenvalues', need 5");
    expect(notEnoughItemsMessage(1, 'eigenvalues')).toBe("1 gradable item for 'eigenvalues', need 5");
  });

  it('the break-even sentence states the consequence, never the probability as a formula', () => {
    const mcq = breakEvenSentence('mcq', 2, -(2 / 3));
    expect(mcq).toContain('⅔ of a mark');
    expect(mcq).toContain('25 in 100');
    expect(mcq).not.toMatch(/EV|expected value|P\/\(/);
    expect(breakEvenSentence('nat', 1, 0)).toContain('always worth attempting');
  });

  it('the drill\'s reason sentences never use loss colour words', () => {
    const good = skipReason('good_skip', {
      kind: 'mcq', marks: 2, signedMarksWrong: -(2 / 3),
      successProbability: 0.15, expected: -0.27, breakEven: 0.25,
    });
    expect(good).toContain('Right call');
    expect(good).not.toMatch(/wrong|incorrect|failed/i);
  });
});
