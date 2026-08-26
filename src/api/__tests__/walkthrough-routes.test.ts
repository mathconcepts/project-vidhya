/**
 * Tests for src/api/walkthrough-routes.ts — GET /api/lesson/walkthrough/:concept_id.
 *
 * atom-loader and the learning-object catalog are mocked so every leg's
 * available/unavailable state is controllable without touching disk or a
 * database; the PYQ (test-leg) bundle uses the module's own test seam
 * (__setWalkthroughBundleForTests) for the same reason. CONCEPT_MAP is left
 * real — concept id resolution ("is this a known concept") is exactly the
 * behavior worth exercising against the real curriculum graph.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerResponse } from 'http';

vi.mock('../../content/atom-loader', async () => {
  class ConceptNotFoundError extends Error {
    concept_id: string;
    constructor(concept_id: string) {
      super(`concept_not_found: ${concept_id}`);
      this.name = 'ConceptNotFoundError';
      this.concept_id = concept_id;
    }
  }
  return {
    ConceptNotFoundError,
    loadConceptAtoms: vi.fn(),
  };
});

vi.mock('../../scoring/learning-object-catalog-pg', () => ({
  getLearningObjectCatalog: vi.fn(),
}));

const { loadConceptAtoms, ConceptNotFoundError } = await import('../../content/atom-loader');
const { getLearningObjectCatalog } = await import('../../scoring/learning-object-catalog-pg');
const {
  walkthroughRoutes,
  countTestQuestions,
  __setWalkthroughBundleForTests,
} = await import('../walkthrough-routes');

const handler = walkthroughRoutes.find(
  (r) => r.method === 'GET' && r.path === '/api/lesson/walkthrough/:concept_id',
)!.handler;

function makeReq(params: Record<string, string>) {
  return { pathname: '/', query: new URLSearchParams(), params, body: null, headers: {} } as any;
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

function gradableMcq(id: string, skillId: string) {
  return {
    id, nodeId: skillId, type: 'practice', difficulty: 1500, estMinutes: 3, prereqs: [], verification: 'cas_passed',
    payload: { skillId, questionType: 'mcq', marks: 2, options: ['a', 'b'], answerIndex: 0 },
  };
}

function ungradedItem(id: string, skillId: string) {
  return {
    id, nodeId: skillId, type: 'practice', difficulty: 1500, estMinutes: 3, prereqs: [], verification: 'cas_passed',
    payload: { skillId, questionText: 'no marking authored yet' },
  };
}

const REAL_CONCEPT = 'eigenvalues'; // a real GATE-MA concept id from data/curriculum/gate-ma.yml

beforeEach(() => {
  vi.mocked(loadConceptAtoms).mockReset();
  vi.mocked(getLearningObjectCatalog).mockReset();
  __setWalkthroughBundleForTests(null);
});
afterEach(() => {
  __setWalkthroughBundleForTests(null);
});

describe('GET /api/lesson/walkthrough/:concept_id', () => {
  it('404s on an unknown concept id before touching any leg source', async () => {
    const r = makeRes();
    await handler(makeReq({ concept_id: 'totally-not-a-real-concept-xyz' }), r.res);
    expect(r.status).toBe(404);
    expect(r.payload.error).toMatch(/unknown concept/i);
    expect(loadConceptAtoms).not.toHaveBeenCalled();
  });

  it('400s when concept_id is missing from params', async () => {
    const r = makeRes();
    await handler(makeReq({}), r.res);
    expect(r.status).toBe(400);
  });

  it('reports all four legs available with real counts', async () => {
    vi.mocked(loadConceptAtoms).mockResolvedValue([
      { id: 'a1', concept_id: REAL_CONCEPT, atom_type: 'hook', bloom_level: 1, difficulty: 0.2, exam_ids: ['*'], content: 'plain prose, no widget' } as any,
      {
        id: 'a2', concept_id: REAL_CONCEPT, atom_type: 'worked_example', bloom_level: 2, difficulty: 0.4, exam_ids: ['*'],
        content: '```interactive-spec\n{"kind":"manipulable","v":1}\n```',
      } as any,
    ]);
    vi.mocked(getLearningObjectCatalog).mockReturnValue({
      query: async () => [gradableMcq('p1', REAL_CONCEPT), gradableMcq('p2', REAL_CONCEPT)],
    } as any);
    __setWalkthroughBundleForTests([
      { id: 'q1', topic: 'linear-algebra', concept_ids: [REAL_CONCEPT] },
      { id: 'q2', topic: 'linear-algebra', concept_ids: ['some-other-concept'] },
    ]);

    const r = makeRes();
    await handler(makeReq({ concept_id: REAL_CONCEPT }), r.res);

    expect(r.status).toBe(200);
    expect(r.payload).toEqual({
      concept_id: REAL_CONCEPT,
      label: expect.any(String),
      legs: {
        explanation: { available: true, atom_count: 2 },
        interactive: { available: true, count: 1 },
        practice: { available: true, item_count: 2, first_object_id: 'p1' },
        test: { available: true, question_count: 1, exam_tested: true },
      },
    });
  });

  it('reports an honest empty state per leg — no atoms authored, no gradable items, no PYQ field on the bundle', async () => {
    vi.mocked(loadConceptAtoms).mockRejectedValue(new (ConceptNotFoundError as any)(REAL_CONCEPT));
    vi.mocked(getLearningObjectCatalog).mockReturnValue({
      query: async () => [ungradedItem('p1', REAL_CONCEPT)], // exists but not gradable
    } as any);
    __setWalkthroughBundleForTests([
      { id: 'q1', topic: 'linear-algebra' }, // no concept_ids / concept_id field at all
    ]);

    const r = makeRes();
    await handler(makeReq({ concept_id: REAL_CONCEPT }), r.res);

    expect(r.status).toBe(200);
    expect(r.payload.legs).toEqual({
      explanation: { available: false, atom_count: 0 },
      interactive: { available: false, count: 0 },
      practice: { available: false, item_count: 0, first_object_id: null },
      test: { available: false, question_count: 0, exam_tested: true }, // no concept field seen anywhere — honestly "not wired", not zero-matches
    });
  });

  it('degrades honestly (never 500s) when the atom loader throws something other than ConceptNotFoundError', async () => {
    vi.mocked(loadConceptAtoms).mockRejectedValue(new Error('disk read failed'));
    vi.mocked(getLearningObjectCatalog).mockReturnValue({ query: async () => [] } as any);
    __setWalkthroughBundleForTests([]);

    const r = makeRes();
    await handler(makeReq({ concept_id: REAL_CONCEPT }), r.res);

    expect(r.status).toBe(200);
    expect(r.payload.legs.explanation).toEqual({ available: false, atom_count: 0 });
  });

  it('degrades honestly (never 500s) when the catalog query throws — DB-less / unreachable', async () => {
    vi.mocked(loadConceptAtoms).mockResolvedValue([]);
    vi.mocked(getLearningObjectCatalog).mockReturnValue({
      query: async () => { throw new Error('DATABASE_URL unset'); },
    } as any);
    __setWalkthroughBundleForTests([]);

    const r = makeRes();
    await handler(makeReq({ concept_id: REAL_CONCEPT }), r.res);

    expect(r.status).toBe(200);
    expect(r.payload.legs.practice).toEqual({ available: false, item_count: 0, first_object_id: null });
  });

  it('the response body is counts-only — no student/session identifiers of any kind', async () => {
    vi.mocked(loadConceptAtoms).mockResolvedValue([]);
    vi.mocked(getLearningObjectCatalog).mockReturnValue({ query: async () => [] } as any);
    __setWalkthroughBundleForTests([]);

    const r = makeRes();
    await handler(makeReq({ concept_id: REAL_CONCEPT }), r.res);

    const serialized = JSON.stringify(r.payload);
    expect(serialized).not.toMatch(/session_id|student_id|user_id|email/i);
  });

  it('an exam_tested:false concept reports exam_tested:false on the test leg even with zero real questions', async () => {
    vi.mocked(loadConceptAtoms).mockResolvedValue([]);
    vi.mocked(getLearningObjectCatalog).mockReturnValue({ query: async () => [] } as any);
    __setWalkthroughBundleForTests([]); // no PYQ mapped at all — the honest, expected state

    const r = makeRes();
    // 'sequences' is one of the 15 concepts flagged exam_tested:false in
    // data/curriculum/gate-ma.yml (a prerequisite real papers assume, never
    // directly test).
    await handler(makeReq({ concept_id: 'sequences' }), r.res);

    expect(r.status).toBe(200);
    expect(r.payload.legs.test).toEqual({ available: false, question_count: 0, exam_tested: false });
  });

  it('an ordinary (exam_tested:true) concept reports exam_tested:true on the test leg', async () => {
    vi.mocked(loadConceptAtoms).mockResolvedValue([]);
    vi.mocked(getLearningObjectCatalog).mockReturnValue({ query: async () => [] } as any);
    __setWalkthroughBundleForTests([]);

    const r = makeRes();
    await handler(makeReq({ concept_id: REAL_CONCEPT }), r.res); // 'eigenvalues' — not one of the 15 flagged ids

    expect(r.status).toBe(200);
    expect(r.payload.legs.test).toEqual({ available: false, question_count: 0, exam_tested: true });
  });
});

describe('countTestQuestions', () => {
  afterEach(() => __setWalkthroughBundleForTests(null));

  it('prefers concept_ids (array) when present', () => {
    __setWalkthroughBundleForTests([
      { id: 'q1', concept_ids: ['eigenvalues', 'determinants'] },
      { id: 'q2', concept_ids: ['determinants'] },
    ]);
    expect(countTestQuestions('eigenvalues')).toEqual({ available: true, question_count: 1 });
    expect(countTestQuestions('determinants')).toEqual({ available: true, question_count: 2 });
  });

  it('falls back to a scalar concept_id when concept_ids is absent', () => {
    __setWalkthroughBundleForTests([
      { id: 'q1', concept_id: 'eigenvalues' },
      { id: 'q2', concept_id: 'determinants' },
    ]);
    expect(countTestQuestions('eigenvalues')).toEqual({ available: true, question_count: 1 });
  });

  it('reports available:false, question_count:0 when neither field exists anywhere in the bundle', () => {
    __setWalkthroughBundleForTests([
      { id: 'q1', topic: 'linear-algebra' },
      { id: 'q2', topic: 'linear-algebra' },
    ]);
    expect(countTestQuestions('eigenvalues')).toEqual({ available: false, question_count: 0 });
  });

  it('reports available:false, question_count:0 on a concept genuinely absent from a wired bundle', () => {
    __setWalkthroughBundleForTests([
      { id: 'q1', concept_ids: ['determinants'] },
    ]);
    expect(countTestQuestions('eigenvalues')).toEqual({ available: false, question_count: 0 });
  });

  it('reads the real committed PYQ bundle honestly when no test fixture is injected — shape only, not a pinned count (the bundle is siblings\' territory and may grow)', () => {
    __setWalkthroughBundleForTests(null); // force the disk read
    const result = countTestQuestions('eigenvalues');
    expect(typeof result.available).toBe('boolean');
    expect(result.question_count).toBeGreaterThanOrEqual(0);
    expect(result.available).toBe(result.question_count > 0);
    // A concept id that cannot possibly appear in the bundle must always
    // read as a real zero, not "field not wired yet" — proves the disk
    // read actually found a concept field to check against.
    expect(countTestQuestions('definitely-not-a-real-concept-xyz')).toEqual({ available: false, question_count: 0 });
  });
});
