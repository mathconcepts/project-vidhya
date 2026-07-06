/**
 * Tests for POST /api/practice/attempt (src/api/practice-routes.ts).
 *
 * Everything is injected through setPracticeDepsForTests() — no
 * Postgres, no JWT. requireRole is mocked (auth wiring is covered by
 * auth-middleware's own tests); this file covers the endpoint's
 * contract: honest refusals for unmarked items, strict response
 * validation, deterministic GATE grading, Attempt threading into
 * StudentModel.update(), and DB-less "graded but not recorded".
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerResponse } from 'http';
import { InMemoryCatalog } from '../../scoring/learning-object-catalog';
import type { Attempt, LearningObject, StudentModel } from '../../core/interfaces';

const mockRequireRole = vi.fn();
vi.mock('../auth-middleware', () => ({
  requireRole: (...args: any[]) => mockRequireRole(...args),
}));

const { practiceRoutes, setPracticeDepsForTests, gateItemFromPayload } = await import('../practice-routes');

const handler = practiceRoutes.find(r => r.method === 'POST' && r.path === '/api/practice/attempt')!.handler;

function makeReq(body: unknown) {
  return {
    pathname: '/api/practice/attempt',
    query: new URLSearchParams(),
    params: {},
    body,
    headers: {},
  } as any;
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

function obj(id: string, payload: Record<string, unknown>): LearningObject {
  return {
    id, nodeId: 'eigenvalues', type: 'practice', difficulty: 1500,
    estMinutes: 3, prereqs: [], verification: 'cas_passed',
    payload: { skillId: 'eigenvalues', ...payload },
  };
}

const MARKED_MCQ = obj('mcq-1', {
  questionType: 'mcq', marks: 2, options: ['a', 'b', 'c', 'd'], answerIndex: 2,
});
const MARKED_MSQ = obj('msq-1', {
  questionType: 'msq', marks: 2, options: ['a', 'b', 'c'], answerIndices: [0, 2],
});
const MARKED_NAT = obj('nat-1', {
  questionType: 'nat', marks: 1, answerRange: [1.4, 1.6],
});
const UNMARKED = obj('plain-1', {});

function fakeStudentModel(updates: Attempt[], failUpdate = false): StudentModel {
  return {
    abilityFor: async () => ({ studentId: 's', skillId: 'k', rating: 1500, n: 0 } as any),
    retrievability: async () => 0,
    masteryState: async () => 'learning' as any,
    errorProfile: async () => ({} as any),
    update: async (a: Attempt) => {
      if (failUpdate) throw new Error('DATABASE_URL not configured');
      updates.push(a);
    },
  } as unknown as StudentModel;
}

describe('POST /api/practice/attempt', () => {
  const updates: Attempt[] = [];
  const recalibrations: Array<{ id: string; correct: boolean }> = [];

  beforeEach(() => {
    updates.length = 0;
    recalibrations.length = 0;
    mockRequireRole.mockReset();
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
    setPracticeDepsForTests({
      catalog: () => new InMemoryCatalog([MARKED_MCQ, MARKED_MSQ, MARKED_NAT, UNMARKED]),
      studentModel: () => fakeStudentModel(updates),
      recordProblemAttempt: async (id, correct) => { recalibrations.push({ id, correct }); },
    });
  });

  afterEach(() => setPracticeDepsForTests(null));

  it('grades a correct 2-mark MCQ and records the attempt', async () => {
    const r = makeRes();
    await handler(makeReq({ object_id: 'mcq-1', response: { selectedIndex: 2 }, latency_ms: 4200, ts: 1000 }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.grade).toMatchObject({ earned: 2, max: 2, correct: true });
    expect(r.payload.marking).toEqual({ marks_correct: 2, marks_wrong: -2 / 3 });
    expect(r.payload.recorded).toBe(true);
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      studentId: 'student-1', objectId: 'mcq-1', skillId: 'eigenvalues',
      correct: true, latencyMs: 4200, ts: 1000,
      partialMarks: { earned: 2, max: 2 },
    });
    expect(recalibrations).toEqual([{ id: 'mcq-1', correct: true }]);
  });

  it('applies GATE negative marking on a wrong 2-mark MCQ (−2/3)', async () => {
    const r = makeRes();
    await handler(makeReq({ object_id: 'mcq-1', response: { selectedIndex: 0 } }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.grade.earned).toBeCloseTo(-2 / 3, 9);
    expect(r.payload.grade.correct).toBe(false);
    expect(updates[0].partialMarks!.earned).toBeCloseTo(-2 / 3, 9);
  });

  it('grades MSQ with the conservative exact-set rule and no negative marking', async () => {
    const exact = makeRes();
    await handler(makeReq({ object_id: 'msq-1', response: { selectedIndices: [2, 0] } }), exact.res);
    expect(exact.payload.grade).toMatchObject({ earned: 2, correct: true });

    const partial = makeRes();
    await handler(makeReq({ object_id: 'msq-1', response: { selectedIndices: [0] } }), partial.res);
    expect(partial.payload.grade).toMatchObject({ earned: 0, correct: false });
  });

  it('grades NAT by inclusive range', async () => {
    const inRange = makeRes();
    await handler(makeReq({ object_id: 'nat-1', response: { value: 1.5 } }), inRange.res);
    expect(inRange.payload.grade).toMatchObject({ earned: 1, correct: true });

    const outOfRange = makeRes();
    await handler(makeReq({ object_id: 'nat-1', response: { value: 2.0 } }), outOfRange.res);
    expect(outOfRange.payload.grade).toMatchObject({ earned: 0, correct: false });
  });

  it('treats a skipped attempt as 0 marks, records it, but skips recalibration', async () => {
    const r = makeRes();
    await handler(makeReq({ object_id: 'mcq-1', response: { skipped: true } }), r.res);
    expect(r.payload.grade).toMatchObject({ earned: 0, correct: false });
    expect(updates).toHaveLength(1);
    expect(recalibrations).toHaveLength(0);
  });

  it('refuses an unmarked item with 422 — never guesses marking', async () => {
    const r = makeRes();
    await handler(makeReq({ object_id: 'plain-1', response: { selectedIndex: 0 } }), r.res);
    expect(r.status).toBe(422);
    expect(updates).toHaveLength(0);
  });

  it('404s an unknown object_id and 400s a missing one', async () => {
    const missing = makeRes();
    await handler(makeReq({ object_id: 'nope', response: { selectedIndex: 0 } }), missing.res);
    expect(missing.status).toBe(404);

    const noId = makeRes();
    await handler(makeReq({ response: { selectedIndex: 0 } }), noId.res);
    expect(noId.status).toBe(400);
  });

  it('400s malformed responses (wrong shape for the item kind)', async () => {
    for (const body of [
      { object_id: 'mcq-1', response: { selectedIndex: 9 } },       // out of bounds
      { object_id: 'mcq-1', response: { value: 1 } },               // nat shape on mcq
      { object_id: 'msq-1', response: { selectedIndices: [] } },    // empty
      { object_id: 'nat-1', response: { value: Infinity } },        // non-finite
      { object_id: 'nat-1', response: {} },                          // nothing
    ]) {
      const r = makeRes();
      await handler(makeReq(body), r.res);
      expect(r.status).toBe(400);
    }
    expect(updates).toHaveLength(0);
  });

  it('still grades when the student model is unavailable — recorded: false (DB-less contract)', async () => {
    setPracticeDepsForTests({
      catalog: () => new InMemoryCatalog([MARKED_MCQ]),
      studentModel: () => fakeStudentModel(updates, true),
      recordProblemAttempt: async (id, correct) => { recalibrations.push({ id, correct }); },
    });
    const r = makeRes();
    await handler(makeReq({ object_id: 'mcq-1', response: { selectedIndex: 2 } }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.grade.correct).toBe(true);
    expect(r.payload.recorded).toBe(false);
    expect(recalibrations).toHaveLength(0);   // no recalibration off an unrecorded attempt
  });
});

describe('gateItemFromPayload — refusal reasons', () => {
  it('names the missing piece precisely', () => {
    expect(gateItemFromPayload('x', {})).toMatch(/question_type/);
    expect(gateItemFromPayload('x', { questionType: 'mcq' })).toMatch(/marks/);
    expect(gateItemFromPayload('x', { questionType: 'mcq', marks: 2 })).toMatch(/options/);
    expect(gateItemFromPayload('x', { questionType: 'mcq', marks: 2, options: ['a', 'b'] })).toMatch(/answer_index/);
    expect(gateItemFromPayload('x', { questionType: 'mcq', marks: 2, options: ['a', 'b'], answerIndex: 5 })).toMatch(/answer_index/);
    expect(gateItemFromPayload('x', { questionType: 'msq', marks: 2, options: ['a', 'b'] })).toMatch(/answer_indices/);
    expect(gateItemFromPayload('x', { questionType: 'nat', marks: 1, answerRange: [2, 1] })).toMatch(/answer_range/);
  });

  it('builds a complete GateItem when everything is present', () => {
    const item = gateItemFromPayload('x', {
      questionType: 'mcq', marks: 2, options: ['a', 'b', 'c'], answerIndex: 1,
    });
    expect(item).toMatchObject({ id: 'x', kind: 'mcq', marks: 2, answerIndex: 1 });
  });
});
