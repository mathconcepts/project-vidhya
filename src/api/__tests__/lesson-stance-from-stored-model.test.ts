/**
 * POST /api/lesson/compose — stance comes from stored state, not just from
 * whatever the browser volunteered.
 *
 * ## The bug these lock down
 *
 * The enrichment branch that loads a student's stored model was gated on
 * `!lessonReq.student`. `LessonPage` always posts `student: { session_id }` —
 * truthy, and carrying no signal at all — so the guard read "the caller
 * supplied a snapshot" on every request and the stored model was never
 * consulted. Every signed-in student therefore composed against an empty
 * snapshot, and `deriveFraming` returned `steady` for all of them, which
 * serves the base body.
 *
 * The visible consequence was that 606 authored stance variants across 101
 * concepts were unreachable for real traffic. The only path that ever saw them
 * was the admin demo walkthrough, which posts a real persona snapshot and so
 * happened to satisfy the old guard.
 *
 * Nothing failed while that was true: the content shipped, every gate was
 * green, and the readiness report counted files on disk. That is why these are
 * behavioural assertions about the SERVED body — `served_stance` is set only
 * when an alternative body was actually swapped in — rather than assertions
 * about the guard's shape, which is the thing that was wrong in the first
 * place.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerResponse } from 'http';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: { Pool: vi.fn(() => ({ query: mockQuery })) },
}));

/** What the stored-model reader will return for the session under test. */
let storedModel: Record<string, unknown> | null = null;
const readStudentModel = vi.fn(async () => storedModel);
const getOrCreateStudentModel = vi.fn(async () => storedModel);

vi.mock('../../gbrain/student-model', () => ({
  readStudentModel: (...a: unknown[]) => readStudentModel(...(a as [])),
  getOrCreateStudentModel: (...a: unknown[]) => getOrCreateStudentModel(...(a as [])),
}));

const { lessonRoutes } = await import('../lesson-routes');
const { hasLearningSignal } = await import('../lesson-routes');
const { __resetStancePinsForTests } = await import('../../sessions/stance-pin');

/** A concept whose atoms carry authored shaken + assured bodies. */
const CONCEPT = 'eigenvalues';

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
  readStudentModel.mockClear();
  storedModel = null;
  // Stance is pinned per (session, concept) for the length of a read, so a
  // test reusing a session id would otherwise get the previous test's pin.
  __resetStancePinsForTests();
});

afterEach(() => vi.restoreAllMocks());

function makeRes(): { res: ServerResponse; payload: () => any } {
  const captured: any = { status: 200, payload: null };
  const res: any = {
    setHeader: () => {},
    writeHead: (s: number) => { captured.status = s; },
    end: (d?: string) => { if (d) { try { captured.payload = JSON.parse(d); } catch { /* non-JSON */ } } },
    write: () => {},
  };
  Object.defineProperty(res, 'statusCode', {
    get: () => captured.status,
    set: (v: number) => { captured.status = v; },
  });
  return { res, payload: () => captured.payload };
}

async function compose(body: Record<string, unknown>) {
  const { res, payload } = makeRes();
  const req: any = {
    pathname: '/api/lesson/compose',
    query: new URLSearchParams(),
    params: {},
    body,
    headers: {},
    method: 'POST',
  };
  const handler = (lessonRoutes as any).find(
    (r: any) => r.method === 'POST' && String(r.path).includes('compose'),
  );
  await handler.handler(req, res);
  return payload();
}

/** The stance actually served, read off the atoms the student receives. */
function servedStances(payload: any): string[] {
  return (payload?.atoms ?? [])
    .map((a: any) => a.served_stance)
    .filter((s: unknown): s is string => typeof s === 'string');
}

describe('hasLearningSignal', () => {
  it('does not treat a session id as a learning signal', () => {
    // The whole bug in one assertion. session_id identifies the caller and
    // says nothing about how they are doing.
    expect(hasLearningSignal({ session_id: 's-1' } as never)).toBe(false);
  });

  it('is false for absent and for empty containers', () => {
    expect(hasLearningSignal(undefined)).toBe(false);
    expect(
      hasLearningSignal({
        session_id: 's-1',
        mastery_by_concept: {},
        mastery_by_topic: {},
        recent_errors: [],
      } as never),
    ).toBe(false);
  });

  it.each([
    ['mastery_by_concept', { mastery_by_concept: { [CONCEPT]: 0.2 } }],
    ['mastery_by_topic', { mastery_by_topic: { 'linear-algebra': 0.4 } }],
    ['recent_errors', { recent_errors: [{ concept_id: CONCEPT, error_type: 'sign' }] }],
    ['motivation_state', { motivation_state: 'anxious' }],
    ['representation_mode', { representation_mode: 'geometric' }],
  ])('is true when %s carries something', (_label, fields) => {
    expect(hasLearningSignal({ session_id: 's-1', ...fields } as never)).toBe(true);
  });
});

describe('stance is derived from stored state', () => {
  it('reads the stored model when the payload carries only a session id', async () => {
    // Exactly what LessonPage posts.
    storedModel = {
      session_id: 'stored-1',
      mastery_vector: { [CONCEPT]: { score: 0.15 } },
      motivation_state: 'anxious',
      prerequisite_alerts: [],
    };
    const payload = await compose({ concept_id: CONCEPT, session_id: 'stored-1', student: { session_id: 'stored-1' } });

    expect(readStudentModel).toHaveBeenCalledWith('stored-1');
    // The point of the whole change: an anxious student reads the authored
    // unconfident body, not the base text.
    expect(servedStances(payload)).not.toHaveLength(0);
    expect(new Set(servedStances(payload))).toEqual(new Set(['shaken']));
  });

  it('serves the confident body for a thriving stored student', async () => {
    storedModel = {
      session_id: 'stored-2',
      mastery_vector: { [CONCEPT]: { score: 0.9 } },
      motivation_state: 'driven',
      prerequisite_alerts: [],
    };
    const payload = await compose({ concept_id: CONCEPT, session_id: 'stored-2', student: { session_id: 'stored-2' } });
    expect(new Set(servedStances(payload))).toEqual(new Set(['assured']));
  });

  it('serves the base body when there is no stored row', async () => {
    // Absent signal must never read as "this student is struggling".
    storedModel = null;
    const payload = await compose({ concept_id: CONCEPT, session_id: 'nobody', student: { session_id: 'nobody' } });
    expect(readStudentModel).toHaveBeenCalledWith('nobody');
    expect(servedStances(payload)).toEqual([]);
  });

  it('lets a caller-supplied snapshot win over stored state', async () => {
    // The demo persona path posts a real snapshot deliberately. Stored state
    // must not overwrite an explicit statement about who is being shown.
    storedModel = {
      session_id: 'persona-1',
      mastery_vector: { [CONCEPT]: { score: 0.9 } },
      motivation_state: 'driven',
      prerequisite_alerts: [],
    };
    const payload = await compose({
      concept_id: CONCEPT,
      session_id: 'persona-1',
      student: { session_id: 'persona-1', motivation_state: 'anxious', mastery_by_concept: { [CONCEPT]: 0.1 } },
    });

    expect(readStudentModel).not.toHaveBeenCalled();
    expect(new Set(servedStances(payload))).toEqual(new Set(['shaken']));
  });

  it('never writes a student_model row while composing', async () => {
    // Composition serves anonymous traffic. The get-or-create form would
    // insert a row for every session that opened a concept page.
    storedModel = null;
    await compose({ concept_id: CONCEPT, session_id: 'anon-1', student: { session_id: 'anon-1' } });
    expect(getOrCreateStudentModel).not.toHaveBeenCalled();
    const wrote = mockQuery.mock.calls.some(([sql]) =>
      typeof sql === 'string' && /insert\s+into\s+student_model/i.test(sql),
    );
    expect(wrote).toBe(false);
  });

  it('degrades to the base body when the stored read throws', async () => {
    readStudentModel.mockRejectedValueOnce(new Error('connection refused'));
    const payload = await compose({ concept_id: CONCEPT, session_id: 'boom', student: { session_id: 'boom' } });
    expect(payload?.atoms?.length ?? 0).toBeGreaterThan(0);
    expect(servedStances(payload)).toEqual([]);
  });
});
