/**
 * Tests for the A9 fix to GET /api/knowledge/tracks/:id/concept-tree —
 * real prerequisite-DAG edges (replacing the synthetic linear chain) and
 * prereq-aware 'locked' status, for the new GATE-MA track.
 *
 * `getCurrentUser` and `getOrCreateStudentModel` are mocked so this file
 * tests the ROUTE's derivation logic deterministically, independent of a
 * real Postgres connection (same pattern as readiness-routes.test.ts).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerResponse } from 'http';

let mockModel: any = { mastery_vector: {}, prerequisite_alerts: [] };

vi.mock('../../auth/middleware', () => ({
  getCurrentUser: vi.fn(async () => ({ user: { id: 'student-1' } })),
}));

vi.mock('../../gbrain/student-model', () => ({
  getOrCreateStudentModel: vi.fn(async () => mockModel),
}));

const { knowledgeRoutes } = await import('../knowledge-routes');
const { getCurrentUser } = await import('../../auth/middleware');

function makeReq(params: Record<string, string>) {
  return {
    pathname: '/api/knowledge/tracks/GATE-MA/concept-tree',
    query: new URLSearchParams(),
    params,
    body: null,
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
  Object.defineProperty(res, 'statusCode', {
    get: () => captured.status,
    set: (v: number) => { captured.status = v; },
  });
  return { res: res as ServerResponse, get status() { return captured.status; }, get payload() { return captured.payload; } };
}

const conceptTreeHandler = knowledgeRoutes.find(
  r => r.method === 'GET' && r.path === '/api/knowledge/tracks/:id/concept-tree',
)!.handler;

beforeEach(() => {
  mockModel = { mastery_vector: {}, prerequisite_alerts: [] };
  vi.mocked(getCurrentUser).mockResolvedValue({ user: { id: 'student-1' } } as any);
});

describe('GET /api/knowledge/tracks/GATE-MA/concept-tree', () => {
  it('returns all 26 real linear-algebra concepts, not a handful of topic ids', async () => {
    const r = makeRes();
    await conceptTreeHandler(makeReq({ id: 'GATE-MA' }), r.res);
    expect(r.status).toBe(200);
    expect(r.payload.nodes.length).toBe(26);
    const ids = r.payload.nodes.map((n: any) => n.id);
    expect(ids).toContain('eigenvalues');
    expect(ids).toContain('determinants');
    expect(ids).toContain('svd');
  });

  it('edges are the REAL prerequisite DAG, not a synthetic linear chain', async () => {
    const r = makeRes();
    await conceptTreeHandler(makeReq({ id: 'GATE-MA' }), r.res);
    const edges: Array<{ from: string; to: string }> = r.payload.edges;

    // Real edge: eigenvalues depends on BOTH determinants and
    // systems-of-equations (data/curriculum/gate-ma.yml) — a synthetic
    // linear chain could never produce a node with two incoming edges.
    const intoEigen = edges.filter(e => e.to === 'eigenvalues').map(e => e.from);
    expect(intoEigen.sort()).toEqual(['determinants', 'systems-of-equations'].sort());

    // matrix-operations is a real root — no prerequisites — so nothing
    // in the linear chain's "everything has exactly one predecessor"
    // shape survives: it has zero incoming edges.
    expect(edges.some(e => e.to === 'matrix-operations')).toBe(false);

    // A synthetic chain has exactly (n-1) edges for n nodes (25 for 26
    // nodes); the real DAG has 40 edges for the LA subgraph per the plan
    // doc's own count — definitely not 25.
    expect(edges.length).not.toBe(25);
  });

  it('a concept is "locked" (student-facing: "after X") only when a REAL prerequisite is unmet', async () => {
    // matrix-operations has no prerequisites, so even at score 0 it must
    // be workable ('in-progress'), never prereq-locked.
    const r = makeRes();
    await conceptTreeHandler(makeReq({ id: 'GATE-MA' }), r.res);
    const matrixOps = r.payload.nodes.find((n: any) => n.id === 'matrix-operations');
    expect(matrixOps.status).toBe('in-progress');
    expect(matrixOps.why).not.toMatch(/locked/i);

    // eigenvalues depends on determinants + systems-of-equations; with
    // nothing mastered yet it must be locked, and the copy must name the
    // prerequisite, never the word "locked".
    const eigen = r.payload.nodes.find((n: any) => n.id === 'eigenvalues');
    expect(eigen.status).toBe('locked');
    expect(eigen.why.toLowerCase()).not.toContain('locked');
    expect(eigen.why).toMatch(/^after /);
    expect(eigen.why.toLowerCase()).toMatch(/determinants/);
    expect(eigen.why.toLowerCase()).toMatch(/systems/);
  });

  it('unlocks once its real prerequisites are mastered, independent of its own score', async () => {
    mockModel.mastery_vector = {
      determinants: { score: 0.8, attempts: 3, correct: 3, last_update: 'x' },
      'systems-of-equations': { score: 0.75, attempts: 3, correct: 3, last_update: 'x' },
    };
    const r = makeRes();
    await conceptTreeHandler(makeReq({ id: 'GATE-MA' }), r.res);
    const eigen = r.payload.nodes.find((n: any) => n.id === 'eigenvalues');
    expect(eigen.status).toBe('in-progress');
    expect(eigen.why).toBe('in progress');
  });

  it('surfaces provenance (warmup_placed vs demonstrated) for T13\'s frontier dots', async () => {
    mockModel.mastery_vector = {
      'matrix-operations': { score: 0.75, attempts: 2, correct: 2, last_update: 'x', provenance: 'warmup_placed' },
      determinants: { score: 0.75, attempts: 4, correct: 3, last_update: 'x' }, // demonstrated, no provenance
    };
    const r = makeRes();
    await conceptTreeHandler(makeReq({ id: 'GATE-MA' }), r.res);
    const matrixOps = r.payload.nodes.find((n: any) => n.id === 'matrix-operations');
    const det = r.payload.nodes.find((n: any) => n.id === 'determinants');
    expect(matrixOps.provenance).toBe('warmup_placed');
    expect(det.provenance).toBeNull();
  });

  it('non-graph tracks keep their original synthetic-chain behavior unchanged', async () => {
    const r = makeRes();
    await conceptTreeHandler(makeReq({ id: 'CBSE-12-MATH' }), r.res);
    expect(r.status).toBe(200);
    const edges: Array<{ from: string; to: string }> = r.payload.edges;
    // Synthetic chain: n-1 edges for n nodes, each node degree <= 1 in.
    expect(edges.length).toBe(r.payload.nodes.length - 1);
  });
});
