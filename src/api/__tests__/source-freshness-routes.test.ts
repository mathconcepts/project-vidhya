import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SourceFreshnessRecord } from '../../jobs/source-freshness-monitor';

const h = vi.hoisted(() => ({
  role: 'admin' as string | null,
  state: [] as SourceFreshnessRecord[],
  checkCalls: 0,
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

vi.mock('../../jobs/source-freshness-monitor', () => ({
  getSourceFreshnessState: () => h.state,
  checkSourceFreshness: vi.fn(async () => {
    h.checkCalls += 1;
    return h.state;
  }),
}));

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

function fakeReq(query: Record<string, string> = {}) {
  return { query: new URLSearchParams(query) } as never;
}

async function call(query: Record<string, string> = {}) {
  const { sourceFreshnessRoutes } = await import('../source-freshness-routes');
  const route = sourceFreshnessRoutes.find((r) => r.path === '/api/admin/source-freshness');
  expect(route, 'route not registered').toBeDefined();
  const { res, out } = fakeRes();
  await route!.handler(fakeReq(query), res);
  return out;
}

const record = (over: Partial<SourceFreshnessRecord> = {}): SourceFreshnessRecord => ({
  id: 'gate2026-syllabus',
  url: 'https://example.test/syllabus',
  last_hash: 'abc',
  last_checked_at: '2026-09-01T00:00:00.000Z',
  last_changed_at: null,
  last_status: 'unchanged',
  last_error: null,
  ...over,
});

beforeEach(() => {
  h.role = 'admin';
  h.state = [];
  h.checkCalls = 0;
});

describe('GET /api/admin/source-freshness', () => {
  it('is admin-gated', async () => {
    h.role = 'student';
    const out = await call();
    expect(out.status).toBe(403);
  });

  it('reports last known state without triggering a live check by default', async () => {
    h.state = [record()];
    const out = await call();

    expect(h.checkCalls).toBe(0);
    expect(out.body.records).toHaveLength(1);
    expect(out.body.any_changed).toBe(false);
    expect(out.body.any_unreachable).toBe(false);
  });

  it('flags any_changed when a source changed', async () => {
    h.state = [record({ last_status: 'changed', last_changed_at: '2026-09-02T00:00:00.000Z' })];
    const out = await call();

    expect(out.body.any_changed).toBe(true);
  });

  it('flags any_unreachable on a fetch failure', async () => {
    h.state = [record({ last_status: 'fetch_failed', last_error: 'timeout' })];
    const out = await call();

    expect(out.body.any_unreachable).toBe(true);
  });

  it('?refresh=1 runs a live check instead of reading cached state', async () => {
    h.state = [record()];
    const out = await call({ refresh: '1' });

    expect(h.checkCalls).toBe(1);
    expect(out.body.records).toHaveLength(1);
  });
});
