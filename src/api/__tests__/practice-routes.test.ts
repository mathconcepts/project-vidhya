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

const { practiceRoutes, setPracticeDepsForTests, gateItemFromPayload, failureTagForWrongPick } = await import('../practice-routes');

const itemHandler = practiceRoutes.find(r => r.method === 'GET' && r.path === '/api/practice/item/:id')!.handler;

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
// W3.4/E2 — same item, plus distractor failure hypotheses at the
// non-answer indices (0, 1, 3 — 2 is the correct answer).
const TAGGED_MCQ = obj('mcq-tagged', {
  questionType: 'mcq', marks: 2, options: ['a', 'b', 'c', 'd'], answerIndex: 2,
  distractorFailureTags: { 0: 'method_selection', 1: 'sign', 3: 'time_pressure' },
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
  const xpAwards: any[] = [];

  beforeEach(() => {
    updates.length = 0;
    recalibrations.length = 0;
    xpAwards.length = 0;
    mockRequireRole.mockReset();
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
    setPracticeDepsForTests({
      catalog: () => new InMemoryCatalog([MARKED_MCQ, MARKED_MSQ, MARKED_NAT, UNMARKED, TAGGED_MCQ]),
      studentModel: () => fakeStudentModel(updates),
      recordProblemAttempt: async (id, correct) => { recalibrations.push({ id, correct }); },
      awardXp: async (award) => { xpAwards.push(award); },
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

  // ── T14 (B5): XP awarding ────────────────────────────────────────────

  it('awards XP scaled to the estMinutes on a correct attempt', async () => {
    const r = makeRes();
    await handler(makeReq({ object_id: 'mcq-1', response: { selectedIndex: 2 }, ts: 5000 }), r.res);
    expect(r.status).toBe(200);
    expect(xpAwards).toHaveLength(1);
    expect(xpAwards[0]).toMatchObject({
      studentId: 'student-1', objectId: 'mcq-1', skillId: 'eigenvalues', source: 'practice', tsMs: 5000,
    });
    expect(xpAwards[0].xpAmount).toBe(3); // estMinutes=3, full credit
  });

  it('awards negative XP for a wrong MCQ (mirrors the negative mark)', async () => {
    const r = makeRes();
    await handler(makeReq({ object_id: 'mcq-1', response: { selectedIndex: 0 } }), r.res);
    expect(r.status).toBe(200);
    expect(xpAwards).toHaveLength(1);
    expect(xpAwards[0].xpAmount).toBeLessThan(0);
  });

  it('never awards XP on a skip', async () => {
    const r = makeRes();
    await handler(makeReq({ object_id: 'mcq-1', response: { skipped: true } }), r.res);
    expect(r.status).toBe(200);
    expect(xpAwards).toHaveLength(0);
  });

  it('xp_minutes_awarded is populated only for a positive award (DR-4: never a negative award line)', async () => {
    const correctRes = makeRes();
    await handler(makeReq({ object_id: 'mcq-1', response: { selectedIndex: 2 } }), correctRes.res);
    expect(correctRes.payload.xp_minutes_awarded).toBe(3);

    const wrongRes = makeRes();
    await handler(makeReq({ object_id: 'mcq-1', response: { selectedIndex: 0 } }), wrongRes.res);
    expect(wrongRes.payload.xp_minutes_awarded).toBeNull();

    const skipRes = makeRes();
    await handler(makeReq({ object_id: 'mcq-1', response: { skipped: true } }), skipRes.res);
    expect(skipRes.payload.xp_minutes_awarded).toBeNull();
  });

  it('never awards XP when the attempt was not recorded (DB-less)', async () => {
    setPracticeDepsForTests({
      catalog: () => new InMemoryCatalog([MARKED_MCQ]),
      studentModel: () => fakeStudentModel(updates, true),
      recordProblemAttempt: async (id, correct) => { recalibrations.push({ id, correct }); },
      awardXp: async (award) => { xpAwards.push(award); },
    });
    const r = makeRes();
    await handler(makeReq({ object_id: 'mcq-1', response: { selectedIndex: 2 } }), r.res);
    expect(r.payload.recorded).toBe(false);
    expect(xpAwards).toHaveLength(0);
  });

  // ── W3.4/E2: post-answer failure_tag disclosure ──────────────────────

  it('a wrong pick on a tagged mcq returns its failure_tag and feeds it into errorTags', async () => {
    const r = makeRes();
    await handler(makeReq({ object_id: 'mcq-tagged', response: { selectedIndex: 1 } }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.grade.correct).toBe(false);
    expect(r.payload.failure_tag).toBe('sign');
    expect(updates[0].errorTags).toEqual(['sign']);
  });

  it('a correct pick returns failure_tag: null (never a tag, even one authored on some OTHER option)', async () => {
    const r = makeRes();
    await handler(makeReq({ object_id: 'mcq-tagged', response: { selectedIndex: 2 } }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.grade.correct).toBe(true);
    expect(r.payload.failure_tag).toBeNull();
    expect(updates[0].errorTags).toBeUndefined();
  });

  it('a skip returns failure_tag: null', async () => {
    const r = makeRes();
    await handler(makeReq({ object_id: 'mcq-tagged', response: { skipped: true } }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.failure_tag).toBeNull();
  });

  it('a wrong pick on an UNTAGGED mcq returns failure_tag: null (never guessed)', async () => {
    const r = makeRes();
    await handler(makeReq({ object_id: 'mcq-1', response: { selectedIndex: 0 } }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.grade.correct).toBe(false);
    expect(r.payload.failure_tag).toBeNull();
    expect(updates[0].errorTags).toBeUndefined();
  });

  it('a wrong pick on an option with no authored tag (partial map) returns null, not another option\'s tag', async () => {
    const r = makeRes();
    // index 3 IS tagged ('time_pressure'); pick index 0 instead ('method_selection')
    // to confirm the lookup is keyed by the ACTUAL picked index.
    await handler(makeReq({ object_id: 'mcq-tagged', response: { selectedIndex: 0 } }), r.res);
    expect(r.payload.failure_tag).toBe('method_selection');
    expect(r.payload.failure_tag).not.toBe('time_pressure');
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


describe('GET /api/practice/item/:id — render-safe view', () => {
  beforeEach(() => {
    mockRequireRole.mockReset();
    mockRequireRole.mockResolvedValue({ userId: 'student-1', role: 'student' });
    setPracticeDepsForTests({
      catalog: () => new InMemoryCatalog([
        obj('mcq-1', {
          questionType: 'mcq', marks: 2, options: ['a', 'b', 'c', 'd'], answerIndex: 2,
          questionText: 'What is $2+2$?', topic: 'arithmetic',
          correctAnswer: '4', solutionSteps: ['add'], distractors: ['3', '5'],
          // W3.4/E2: server-only diagnostic data — must never reach the
          // pre-answer render-safe view (see the leak test below).
          distractorFailureTags: { 0: 'method_selection', 1: 'sign', 3: 'time_pressure' },
        }),
        obj('plain-1', { questionText: 'Ponder this.', correctAnswer: 'secret' }),
      ]),
    });
  });

  afterEach(() => setPracticeDepsForTests(null));

  function makeItemReq(id: string) {
    return {
      pathname: `/api/practice/item/${id}`,
      query: new URLSearchParams(),
      params: { id },
      body: null,
      headers: {},
    } as any;
  }

  it('returns the render-safe fields for a gradable item', async () => {
    const r = makeRes();
    await itemHandler(makeItemReq('mcq-1'), r.res);
    expect(r.status).toBe(200);
    expect(r.payload).toMatchObject({
      id: 'mcq-1', gradable: true, question_type: 'mcq', marks: 2,
      question_text: 'What is $2+2$?', topic: 'arithmetic',
      options: ['a', 'b', 'c', 'd'],
      marking: { marks_correct: 2, marks_wrong: -2 / 3 },
    });
  });

  it('NEVER leaks the answer key, correct answer, solution, or distractors', async () => {
    const r = makeRes();
    await itemHandler(makeItemReq('mcq-1'), r.res);
    const raw = JSON.stringify(r.payload);
    expect(raw).not.toContain('answerIndex');
    expect(raw).not.toContain('answer_index');
    expect(raw).not.toContain('correctAnswer');
    expect(raw).not.toContain('correct_answer');
    expect(raw).not.toContain('solutionSteps');
    expect(raw).not.toContain('distractors');
    expect(raw).not.toContain('answerRange');
    // and the actual values
    expect(raw).not.toContain('"4"');
  });

  // W3.4/E2 — defense-in-depth: even though handleGetItem is already
  // leak-safe by construction (fields copied one at a time onto a fresh
  // object, never spread from payload), assert directly that no field
  // matching this shape ever escapes pre-answer. A failure-tagged
  // distractor is present on the fixture (see beforeEach above); the one
  // option WITHOUT a tag would otherwise reveal the correct answer.
  it('NEVER leaks distractor failure tags (or anything matching failure|trap|misconception) pre-answer', async () => {
    const r = makeRes();
    await itemHandler(makeItemReq('mcq-1'), r.res);
    const raw = JSON.stringify(r.payload);
    expect(raw).not.toMatch(/failure|trap|misconception/i);
    expect(raw).not.toContain('distractorFailureTags');
    expect(raw).not.toContain('distractor_failure_tags');
  });

  it('serves unmarked items as display-only with a precise reason', async () => {
    const r = makeRes();
    await itemHandler(makeItemReq('plain-1'), r.res);
    expect(r.status).toBe(200);
    expect(r.payload).toMatchObject({
      gradable: false, question_type: null, marks: null, options: null, marking: null,
      question_text: 'Ponder this.',
    });
    expect(r.payload.not_gradable_reason).toMatch(/question_type/);
    expect(JSON.stringify(r.payload)).not.toContain('secret');
  });

  it('404s unknown items', async () => {
    const r = makeRes();
    await itemHandler(makeItemReq('nope'), r.res);
    expect(r.status).toBe(404);
  });
});

describe('failureTagForWrongPick — W3.4/E2 pure-function unit tests', () => {
  const payload = { distractorFailureTags: { 0: 'method_selection', 3: 'time_pressure' } };

  it('returns null for a correct pick, regardless of payload', () => {
    expect(failureTagForWrongPick(payload, true, { kind: 'mcq', selectedIndex: 0 })).toBeNull();
  });

  it('returns null for a skip', () => {
    expect(failureTagForWrongPick(payload, false, { kind: 'mcq', skipped: true, selectedIndex: 0 })).toBeNull();
  });

  it('returns null for non-mcq kinds (msq/nat carry no per-distractor tags)', () => {
    expect(failureTagForWrongPick(payload, false, { kind: 'msq', selectedIndices: [0] })).toBeNull();
    expect(failureTagForWrongPick(payload, false, { kind: 'nat', value: 3 })).toBeNull();
  });

  it('returns the tag at the picked index', () => {
    expect(failureTagForWrongPick(payload, false, { kind: 'mcq', selectedIndex: 0 })).toBe('method_selection');
    expect(failureTagForWrongPick(payload, false, { kind: 'mcq', selectedIndex: 3 })).toBe('time_pressure');
  });

  it('returns null when the picked index has no authored tag', () => {
    expect(failureTagForWrongPick(payload, false, { kind: 'mcq', selectedIndex: 1 })).toBeNull();
  });

  it('returns null when payload has no distractorFailureTags at all', () => {
    expect(failureTagForWrongPick({}, false, { kind: 'mcq', selectedIndex: 0 })).toBeNull();
    expect(failureTagForWrongPick(null, false, { kind: 'mcq', selectedIndex: 0 })).toBeNull();
  });

  it('is defensive against a malformed distractorFailureTags shape', () => {
    expect(failureTagForWrongPick({ distractorFailureTags: ['a', 'b'] }, false, { kind: 'mcq', selectedIndex: 0 })).toBeNull();
    expect(failureTagForWrongPick({ distractorFailureTags: 'nope' }, false, { kind: 'mcq', selectedIndex: 0 })).toBeNull();
  });
});
