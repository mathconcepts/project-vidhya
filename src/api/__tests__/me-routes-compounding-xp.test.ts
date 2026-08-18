/**
 * Tests for the XP/focused-work branch of GET /api/student/compounding
 * (src/api/me-routes.ts's handleCompounding) — T14 (B5, DR-4). This is
 * the ONLY previously-untested branch: "XP detail folds into
 * CompoundingCard's existing expanded grid... best-effort — a lookup
 * failure just omits the row, never breaks the rest of the card."
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerResponse } from 'http';

vi.mock('../../auth/middleware', () => ({
  requireAuth: vi.fn(async () => ({ user: { id: 'student-1' } })),
}));

vi.mock('../../auth/user-store', () => ({
  getUserById: vi.fn(() => ({ id: 'student-1', created_at: '2026-01-01T00:00:00.000Z' })),
}));

vi.mock('../../gbrain/student-model', () => ({
  getOrCreateStudentModel: vi.fn(async () => ({
    concept_mastery: {},
    recent_attempts: [{ timestamp: new Date().toISOString() }],
  })),
}));

vi.mock('../../gbrain/xp-store', () => ({
  totalXpMinutes: vi.fn(),
}));

const { meRoutes } = await import('../me-routes');
const { totalXpMinutes } = await import('../../gbrain/xp-store');

const compoundingHandler = meRoutes.find(
  (r) => r.method === 'GET' && r.path === '/api/student/compounding',
)!.handler;

function makeReq() {
  return { pathname: '/api/student/compounding', query: new URLSearchParams(), params: {}, body: null, headers: {} } as any;
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

beforeEach(() => {
  vi.mocked(totalXpMinutes).mockReset();
});

describe('GET /api/student/compounding — focused-work (XP) detail row', () => {
  it('adds a "focused work" detail row when totalXpMinutes resolves', async () => {
    vi.mocked(totalXpMinutes).mockResolvedValue(64);
    const r = makeRes();

    await compoundingHandler(makeReq(), r.res);

    expect(r.status).toBe(200);
    expect(r.payload.should_show).toBe(true);
    const focusedWorkDetail = r.payload.details.find((d: any) => d.label === 'focused work');
    expect(focusedWorkDetail).toEqual({ label: 'focused work', value: 64, hint: 'min' });
  });

  it('omits the row entirely (never fabricates a value) when the XP lookup fails', async () => {
    vi.mocked(totalXpMinutes).mockRejectedValue(new Error('xp_events table missing'));
    const r = makeRes();

    await compoundingHandler(makeReq(), r.res);

    expect(r.status).toBe(200); // the rest of the card still renders
    expect(r.payload.should_show).toBe(true);
    expect(r.payload.details.find((d: any) => d.label === 'focused work')).toBeUndefined();
  });
});
