/**
 * Tests for src/api/admin-readiness-metrics-routes.ts — T15's admin
 * readout: process-local readiness counters (src/readiness/metrics.ts)
 * plus the previously-dangling getAtomFallbackCounts() on one surface.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  role: 'admin' as string | null,
  atomFallbackCounts: {} as Record<string, number>,
}));

vi.mock('../auth-middleware', () => ({
  requireRole: vi.fn(async (_req: unknown, res: { writeHead: (n: number) => void; end: (s?: string) => void }) => {
    if (h.role !== 'admin') {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'forbidden' }));
      return null;
    }
    return { id: 'admin-1', role: 'admin' };
  }),
}));

vi.mock('../lesson-routes', () => ({
  getAtomFallbackCounts: () => h.atomFallbackCounts,
}));

import { recordArmSelection, recordObjectIdOutcome, recordRedirectFired, recordDiagnoseFallback, resetReadinessMetrics } from '../../readiness/metrics';

function fakeRes() {
  const out = { status: 0, body: null as any };
  return {
    res: {
      writeHead(status: number) { out.status = status; },
      end(payload?: string) { out.body = payload ? JSON.parse(payload) : null; },
    } as never,
    out,
  };
}

async function call() {
  const { adminReadinessMetricsRoutes } = await import('../admin-readiness-metrics-routes');
  const route = adminReadinessMetricsRoutes.find((r) => r.path === '/api/admin/readiness-metrics');
  expect(route, 'route not registered').toBeDefined();
  const { res, out } = fakeRes();
  await route!.handler({} as never, res);
  return out;
}

beforeEach(() => {
  h.role = 'admin';
  h.atomFallbackCounts = {};
  resetReadinessMetrics();
});

describe('GET /api/admin/readiness-metrics', () => {
  it('is admin-gated', async () => {
    h.role = 'student';
    const out = await call();
    expect(out.status).toBe(403);
  });

  it('reports zeroed counters with a since timestamp on a fresh process', async () => {
    const out = await call();
    expect(out.body.next_action_with_object_id).toBe(0);
    expect(out.body.next_action_without_object_id).toBe(0);
    expect(out.body.next_action_object_id_rate).toBeNull();
    expect(out.body.redirect_fired).toBe(0);
    expect(out.body.diagnose_fallback).toBe(0);
    expect(typeof out.body.since).toBe('string');
  });

  it('surfaces recorded counters', async () => {
    recordArmSelection('teach');
    recordArmSelection('practice');
    recordObjectIdOutcome(true);
    recordObjectIdOutcome(false);
    recordRedirectFired();
    recordDiagnoseFallback();

    const out = await call();
    expect(out.body.arm_selections).toEqual({ diagnose: 0, teach: 1, practice: 1, retain: 0 });
    expect(out.body.next_action_object_id_rate).toBeCloseTo(0.5);
    expect(out.body.redirect_fired).toBe(1);
    expect(out.body.diagnose_fallback).toBe(1);
  });

  it('folds in getAtomFallbackCounts() on the same payload', async () => {
    h.atomFallbackCounts = { eigenvalues: 3, determinants: 1 };
    const out = await call();
    expect(out.body.atom_fallback_counts).toEqual({ eigenvalues: 3, determinants: 1 });
  });
});
