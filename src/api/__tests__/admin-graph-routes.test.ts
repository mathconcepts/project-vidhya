/**
 * admin-graph-routes tests (Mission Control, Graph browser panel — scoped
 * down to read-only per the CEO doc's own §15 phase-sequencing table, see
 * the route file's docblock). Auth gate plus the pure aggregators, with
 * the concept-graph / exam-loader primitives exercised against small
 * fixtures rather than the repo's real 82-concept graph so tests don't
 * churn every time gate-ma.yml changes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ServerResponse } from 'http';

vi.mock('../../auth/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../auth/middleware')>();
  return {
    ...actual,
    requireAnyRole: vi.fn(actual.requireAnyRole),
  };
});

vi.mock('../../constants/concept-graph', () => ({
  ALL_CONCEPTS: [
    { id: 'linear-algebra-basics', topic: 'linear-algebra', label: 'Linear Algebra Basics', description: '', difficulty_base: 0.3, gate_frequency: 'high', prerequisites: [] },
    { id: 'eigenvalues', topic: 'linear-algebra', label: 'Eigenvalues', description: '', difficulty_base: 0.6, gate_frequency: 'medium', prerequisites: ['linear-algebra-basics'] },
  ],
}));

vi.mock('../../curriculum/exam-loader', () => ({
  listExamIds: vi.fn(),
  getExam: vi.fn(),
  listSyllabusIds: vi.fn(),
}));

import { requireAnyRole } from '../../auth/middleware';
import { listExamIds, getExam, listSyllabusIds } from '../../curriculum/exam-loader';
import { graphRoutes, buildConceptSummaries, buildExamSummaries, __testing } from '../admin-graph-routes';

const mockedRequireAnyRole = vi.mocked(requireAnyRole);
const mockedListExamIds = vi.mocked(listExamIds);
const mockedGetExam = vi.mocked(getExam);
const mockedListSyllabusIds = vi.mocked(listSyllabusIds);

function findHandler(method: string, routePath: string) {
  const r = graphRoutes.find((x) => x.method === method && x.path === routePath);
  if (!r) throw new Error(`route not found: ${method} ${routePath}`);
  return r.handler;
}

interface FakeRes {
  statusCode: number;
  body: any;
}

function makeRes(): { res: ServerResponse; out: FakeRes } {
  const out: FakeRes = { statusCode: 0, body: null };
  const res = {
    writeHead(code: number) {
      out.statusCode = code;
      return res;
    },
    end(payload?: string) {
      out.body = payload ? JSON.parse(payload) : null;
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function makeReq() {
  return {
    pathname: '/api/admin/graph/summary',
    query: new URLSearchParams(),
    params: {},
    body: {},
    headers: {},
  };
}

function actAsAdmin(): void {
  mockedRequireAnyRole.mockResolvedValue({
    user: { id: 'admin-1', role: 'admin' },
    token_exp: Date.now() / 1000 + 3600,
  } as any);
}

beforeEach(() => {
  mockedRequireAnyRole.mockReset();
  mockedListExamIds.mockReset();
  mockedGetExam.mockReset();
  mockedListSyllabusIds.mockReset();

  mockedListExamIds.mockReturnValue(['gate-ma', 'jee-main']);
  mockedListSyllabusIds.mockReturnValue(['gate-ma']);
  mockedGetExam.mockImplementation((id: string) => {
    if (id === 'gate-ma') {
      return {
        metadata: { id: 'gate-ma', name: 'GATE Engineering Mathematics' },
        syllabus: [{ id: 's1', title: 'Linear Algebra', weight_pct: 15, concept_ids: ['linear-algebra-basics', 'eigenvalues'] }],
        concept_links: [],
        stub_concept_ids: [],
      } as any;
    }
    if (id === 'jee-main') {
      return {
        metadata: { id: 'jee-main', name: 'JEE Main' },
        syllabus: [{ id: 's1', title: 'Calculus', weight_pct: 20, concept_ids: ['limits', 'continuity'] }],
        concept_links: [],
        stub_concept_ids: ['limits', 'continuity'],
      } as any;
    }
    return null;
  });
});

describe('GET /api/admin/graph/summary auth gate', () => {
  it('unauthenticated requests get 401 from the real middleware', async () => {
    const actual = await vi.importActual<typeof import('../../auth/middleware')>('../../auth/middleware');
    mockedRequireAnyRole.mockImplementation(actual.requireAnyRole);
    const handler = findHandler('GET', '/api/admin/graph/summary');
    const { res, out } = makeRes();
    await handler(makeReq() as any, res);
    expect(out.statusCode).toBe(401);
  });
});

describe('GET /api/admin/graph/summary', () => {
  it('returns concepts, a clean dag_health, and per-exam summaries', async () => {
    actAsAdmin();
    const handler = findHandler('GET', '/api/admin/graph/summary');
    const { res, out } = makeRes();
    await handler(makeReq() as any, res);

    expect(out.statusCode).toBe(200);
    expect(out.body.concepts).toEqual([
      { id: 'linear-algebra-basics', topic: 'linear-algebra', label: 'Linear Algebra Basics', difficulty_base: 0.3, gate_frequency: 'high', prerequisites: [] },
      { id: 'eigenvalues', topic: 'linear-algebra', label: 'Eigenvalues', difficulty_base: 0.6, gate_frequency: 'medium', prerequisites: ['linear-algebra-basics'] },
    ]);
    expect(out.body.dag_health).toEqual({ ok: true, cycle: null });

    const gateMa = out.body.exams.find((e: any) => e.id === 'gate-ma');
    const jeeMain = out.body.exams.find((e: any) => e.id === 'jee-main');
    expect(gateMa).toMatchObject({ is_registered_syllabus: true, declared_concept_count: 2, stub_concept_ids: [] });
    expect(jeeMain).toMatchObject({ is_registered_syllabus: false, declared_concept_count: 2, stub_concept_ids: ['limits', 'continuity'] });
  });
});

describe('buildConceptSummaries (pure)', () => {
  it('projects only the display fields, dropping description', () => {
    const summaries = buildConceptSummaries([
      { id: 'a', topic: 't', label: 'A', description: 'long text', difficulty_base: 0.5, gate_frequency: 'low', prerequisites: ['b'] },
    ] as any);
    expect(summaries).toEqual([{ id: 'a', topic: 't', label: 'A', difficulty_base: 0.5, gate_frequency: 'low', prerequisites: ['b'] }]);
  });
});

describe('buildExamSummaries (pure)', () => {
  it('sums nested sub_sections into declared_concept_count', () => {
    mockedGetExam.mockImplementation((id: string) => {
      if (id !== 'nested-exam') return null;
      return {
        metadata: { id: 'nested-exam', name: 'Nested Exam' },
        syllabus: [
          { id: 's1', title: 'A', weight_pct: 10, concept_ids: ['c1'], sub_sections: [{ id: 's1a', title: 'A1', weight_pct: 5, concept_ids: ['c2', 'c3'] }] },
        ],
        concept_links: [],
        stub_concept_ids: [],
      } as any;
    });
    mockedListSyllabusIds.mockReturnValue([]);
    const summaries = buildExamSummaries(['nested-exam']);
    expect(summaries).toEqual([{ id: 'nested-exam', name: 'Nested Exam', is_registered_syllabus: false, declared_concept_count: 3, stub_concept_ids: [] }]);
  });

  it('skips ids getExam cannot resolve rather than throwing', () => {
    mockedGetExam.mockReturnValue(null);
    expect(buildExamSummaries(['ghost-exam'])).toEqual([]);
  });
});

describe('__testing export parity', () => {
  it('exposes the same pure functions used by the handler', () => {
    expect(__testing.buildConceptSummaries).toBe(buildConceptSummaries);
    expect(__testing.buildExamSummaries).toBe(buildExamSummaries);
  });
});
