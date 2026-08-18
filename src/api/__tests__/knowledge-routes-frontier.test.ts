/**
 * Tests for the T13 cluster/dot/builds_on extensions to
 * GET /api/knowledge/tracks/:id/concept-tree (src/api/knowledge-routes.ts).
 * Same mocking pattern as knowledge-routes-concept-tree.test.ts (T9).
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

describe('GET /api/knowledge/tracks/GATE-MA/concept-tree — T13 cluster/dot fields', () => {
  it('every node carries a cluster id/label and a 4-state dot', async () => {
    const r = makeRes();
    await conceptTreeHandler(makeReq({ id: 'GATE-MA' }), r.res);
    expect(r.payload.nodes.length).toBe(26);
    for (const n of r.payload.nodes) {
      expect(typeof n.cluster_id).toBe('string');
      expect(typeof n.cluster_label).toBe('string');
      expect(['mastered', 'placed', 'frontier', 'later']).toContain(n.dot);
    }
  });

  it('top-level clusters summary matches the 4 locked cluster names, with real counts', async () => {
    const r = makeRes();
    await conceptTreeHandler(makeReq({ id: 'GATE-MA' }), r.res);
    expect(r.payload.clusters.map((c: any) => c.label)).toEqual([
      'Matrix operations', 'Determinants & systems', 'Eigen-theory', 'Decompositions',
    ]);
    const total = r.payload.clusters.reduce((sum: number, c: any) => sum + c.count, 0);
    expect(total).toBe(26);
  });

  it('a warmup-placed concept dots as "placed", not "mastered" — the receipt-culture distinction', async () => {
    mockModel.mastery_vector = {
      'matrix-operations': { score: 0.75, attempts: 2, correct: 2, last_update: 'x', provenance: 'warmup_placed' },
      determinants: { score: 0.8, attempts: 4, correct: 3, last_update: 'x' }, // demonstrated
    };
    const r = makeRes();
    await conceptTreeHandler(makeReq({ id: 'GATE-MA' }), r.res);
    const matrixOps = r.payload.nodes.find((n: any) => n.id === 'matrix-operations');
    const det = r.payload.nodes.find((n: any) => n.id === 'determinants');
    expect(matrixOps.dot).toBe('placed');
    expect(det.dot).toBe('mastered');
    // Both still count as "done" for the cluster rollup — placement unlocks
    // downstream concepts exactly like demonstrated mastery does.
    const cluster1 = r.payload.clusters.find((c: any) => c.label === 'Matrix operations');
    expect(cluster1.done_count).toBeGreaterThanOrEqual(1);
  });

  it('a concept with all real prerequisites unmet dots as "later"; one with prereqs clear but not yet attempted dots as "frontier"', async () => {
    const r = makeRes();
    await conceptTreeHandler(makeReq({ id: 'GATE-MA' }), r.res);
    // matrix-operations has no prerequisites at all -> frontier (available), never "later".
    const matrixOps = r.payload.nodes.find((n: any) => n.id === 'matrix-operations');
    expect(matrixOps.dot).toBe('frontier');
    // eigenvalues needs determinants + systems-of-equations, neither mastered -> later.
    const eigen = r.payload.nodes.find((n: any) => n.id === 'eigenvalues');
    expect(eigen.dot).toBe('later');
  });

  it('builds_on lists real prerequisites with a met flag, for the per-concept bottom sheet', async () => {
    mockModel.mastery_vector = {
      determinants: { score: 0.9, attempts: 5, correct: 5, last_update: 'x' },
    };
    const r = makeRes();
    await conceptTreeHandler(makeReq({ id: 'GATE-MA' }), r.res);
    const eigen = r.payload.nodes.find((n: any) => n.id === 'eigenvalues');
    const ids = eigen.builds_on.map((b: any) => b.id).sort();
    expect(ids).toEqual(['determinants', 'systems-of-equations']);
    const det = eigen.builds_on.find((b: any) => b.id === 'determinants');
    const sys = eigen.builds_on.find((b: any) => b.id === 'systems-of-equations');
    expect(det.met).toBe(true);
    expect(sys.met).toBe(false);
  });

  it('non-graph tracks get an empty clusters array (no LA-cluster pollution)', async () => {
    const r = makeRes();
    await conceptTreeHandler(makeReq({ id: 'CBSE-12-MATH' }), r.res);
    expect(r.payload.clusters).toEqual([]);
  });
});
