/**
 * Tests for src/gbrain/mock-exam-store.ts — T22 (ENG-D3), plus the
 * ownership-binding follow-up.
 *
 * Locks the same idempotent-submission shape as quiz-store-pg.ts:
 * claimMockExamSubmission's optimistic WHERE status='in_progress' guard
 * means only the FIRST submit call grades; a later call for the same
 * exam id replays the persisted analysis instead of re-grading.
 *
 * Also locks the ownership-claim primitives (mock-exam-routes.ts's IDOR
 * fix): claimMockExamOwner is an atomic claim-if-null on ONE exam row,
 * sessionOwner reports whether ANY row under a session_id has ever been
 * claimed, and claimUnclaimedSessionRows stamps every unclaimed row under
 * a session_id in one shot.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { __resetSharedPoolForTests } from '../../storage/pool';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockQuery })),
  },
}));

beforeEach(() => {
  mockQuery.mockReset();
  __resetSharedPoolForTests();
  process.env.DATABASE_URL = 'postgres://test/test';
});

function rawRow(over: Record<string, unknown> = {}) {
  return {
    id: 'exam1',
    session_id: 'sess1',
    exam_key: 'gate-ma',
    questions: [{ q: 1 }],
    time_limit_minutes: 90,
    status: 'in_progress',
    late: false,
    score: null,
    max_marks: null,
    created_at: '2026-06-20T00:00:00.000Z',
    submitted_at: null,
    graded_at: null,
    analysis: null,
    ...over,
  };
}

describe('claimMockExamSubmission', () => {
  it('performs the in_progress→submitted transition on the first call (fresh: true)', async () => {
    const { claimMockExamSubmission } = await import('../mock-exam-store');
    mockQuery.mockResolvedValueOnce({
      rows: [rawRow({ status: 'submitted', submitted_at: '2026-06-20T01:30:00.000Z' })],
    });

    const result = await claimMockExamSubmission('exam1', new Date('2026-06-20T01:30:00.000Z').getTime());

    expect(result).not.toBeNull();
    expect(result!.fresh).toBe(true);
    const [sql] = mockQuery.mock.calls[0];
    expect(String(sql)).toContain("WHERE id = $1 AND status = 'in_progress'");
  });

  it('a second claim on an already-submitted exam replays the persisted analysis instead of re-grading', async () => {
    const { claimMockExamSubmission } = await import('../mock-exam-store');
    mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE matches nothing — already submitted
    mockQuery.mockResolvedValueOnce({
      rows: [rawRow({ status: 'submitted', score: 45, max_marks: 100, analysis: { earned: 45 } })],
    });

    const result = await claimMockExamSubmission('exam1', Date.now());

    expect(result!.fresh).toBe(false);
    expect(result!.row.analysis).toEqual({ earned: 45 });
    expect(result!.row.score).toBe(45);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});

describe('claimMockExamOwner', () => {
  it('claims an unowned exam and returns the new owner (atomic UPDATE ... WHERE owner_user_id IS NULL)', async () => {
    const { claimMockExamOwner } = await import('../mock-exam-store');
    mockQuery.mockResolvedValueOnce({ rows: [{ owner_user_id: 'student-1' }] });

    const owner = await claimMockExamOwner('exam1', 'student-1');

    expect(owner).toBe('student-1');
    const [sql, params] = mockQuery.mock.calls[0];
    expect(String(sql)).toContain('owner_user_id IS NULL');
    expect(String(sql)).toContain('RETURNING owner_user_id');
    expect(params).toEqual(['exam1', 'student-1']);
  });

  it('a no-op claim (already owned) returns the EXISTING owner, not the caller — the caller must compare, never assume it won', async () => {
    const { claimMockExamOwner } = await import('../mock-exam-store');
    mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE matched nothing — already owned
    mockQuery.mockResolvedValueOnce({ rows: [rawRow({ owner_user_id: 'other-student' })] }); // fallback SELECT

    const owner = await claimMockExamOwner('exam1', 'student-2');

    expect(owner).toBe('other-student');
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});

describe('sessionOwner', () => {
  it('returns the owner when a claimed row exists for the session', async () => {
    const { sessionOwner } = await import('../mock-exam-store');
    mockQuery.mockResolvedValueOnce({ rows: [{ owner_user_id: 'student-1' }] });

    const owner = await sessionOwner('anon-uuid-xyz');

    expect(owner).toBe('student-1');
    const [sql, params] = mockQuery.mock.calls[0];
    expect(String(sql)).toContain('owner_user_id IS NOT NULL');
    expect(params).toEqual(['anon-uuid-xyz']);
  });

  it('returns null when the session has no claimed row (brand new, or fully legacy/unclaimed)', async () => {
    const { sessionOwner } = await import('../mock-exam-store');
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const owner = await sessionOwner('anon-uuid-xyz');
    expect(owner).toBeNull();
  });
});

describe('claimUnclaimedSessionRows', () => {
  it('stamps the given user onto every unclaimed row for the session', async () => {
    const { claimUnclaimedSessionRows } = await import('../mock-exam-store');
    mockQuery.mockResolvedValueOnce({ rowCount: 2 });

    await claimUnclaimedSessionRows('anon-uuid-xyz', 'student-1');

    const [sql, params] = mockQuery.mock.calls[0];
    expect(String(sql)).toContain('SET owner_user_id = $2');
    expect(String(sql)).toContain('owner_user_id IS NULL');
    expect(params).toEqual(['anon-uuid-xyz', 'student-1']);
  });
});
