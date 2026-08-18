/**
 * Tests for src/scoring/quiz-store-pg.ts — T14 (B5).
 *
 * Locks:
 *   - claimSubmission's optimistic WHERE status='in_progress' guard: the
 *     first call performs the transition (fresh: true); a second call for
 *     the same id (already submitted) replays the persisted row instead of
 *     re-grading (fresh: false) — double-submit idempotency at the session
 *     level.
 *   - getLastSubmittedQuizAt scopes strictly to status='submitted' — an
 *     in-progress (abandoned) quiz must never move the cadence baseline.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockQuery })),
  },
}));

beforeEach(() => {
  mockQuery.mockReset();
  process.env.DATABASE_URL = 'postgres://test/test';
});

function rawRow(over: Record<string, unknown> = {}) {
  return {
    id: 'q1',
    student_id: 's1',
    item_ids: ['o1', 'o2'],
    status: 'in_progress',
    started_at: '2026-06-20T00:00:00.000Z',
    deadline_at: '2026-06-20T00:08:00.000Z',
    submitted_at: null,
    graded_at: null,
    late: false,
    score: null,
    max_marks: null,
    result: null,
    ...over,
  };
}

describe('claimSubmission', () => {
  it('performs the in_progress→submitted transition on the first call (fresh: true)', async () => {
    process.env.DATABASE_URL = 'postgres://test/test';
    const { claimSubmission } = await import('../quiz-store-pg');
    mockQuery.mockResolvedValueOnce({ rows: [rawRow({ status: 'submitted', submitted_at: '2026-06-20T00:05:00.000Z' })] });

    const result = await claimSubmission('q1', new Date('2026-06-20T00:05:00.000Z').getTime());

    expect(result).not.toBeNull();
    expect(result!.fresh).toBe(true);
    expect(result!.row.status).toBe('submitted');
    const [sql, params] = mockQuery.mock.calls[0];
    expect(String(sql)).toContain("WHERE id = $1 AND status = 'in_progress'");
    expect(params[0]).toBe('q1');
  });

  it('a second claim on an already-submitted quiz returns fresh:false and replays the persisted row, without re-querying for a fake fresh claim', async () => {
    process.env.DATABASE_URL = 'postgres://test/test';
    const { claimSubmission } = await import('../quiz-store-pg');
    // UPDATE...WHERE status='in_progress' matches nothing (already submitted).
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // Fallback SELECT finds the already-submitted row.
    mockQuery.mockResolvedValueOnce({
      rows: [rawRow({ status: 'submitted', submitted_at: '2026-06-20T00:05:00.000Z', score: 4, max_marks: 6, result: { ok: true } })],
    });

    const result = await claimSubmission('q1', new Date('2026-06-20T00:06:00.000Z').getTime());

    expect(result).not.toBeNull();
    expect(result!.fresh).toBe(false);
    expect(result!.row.score).toBe(4);
    expect(result!.row.result).toEqual({ ok: true });
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});

describe('getLastSubmittedQuizAt', () => {
  it('scopes the query to status = \'submitted\' only', async () => {
    process.env.DATABASE_URL = 'postgres://test/test';
    const { getLastSubmittedQuizAt } = await import('../quiz-store-pg');
    mockQuery.mockResolvedValueOnce({ rows: [{ last_submitted_at: '2026-06-15T10:00:00.000Z' }] });

    const result = await getLastSubmittedQuizAt('s1');

    expect(result).toBe(new Date('2026-06-15T10:00:00.000Z').getTime());
    const [sql, params] = mockQuery.mock.calls[0];
    expect(String(sql)).toContain("status = 'submitted'");
    expect(params).toEqual(['s1']);
  });
});
