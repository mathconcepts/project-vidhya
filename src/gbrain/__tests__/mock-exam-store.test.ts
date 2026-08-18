/**
 * Tests for src/gbrain/mock-exam-store.ts — T22 (ENG-D3).
 *
 * Locks the same idempotent-submission shape as quiz-store-pg.ts:
 * claimMockExamSubmission's optimistic WHERE status='in_progress' guard
 * means only the FIRST submit call grades; a later call for the same
 * exam id replays the persisted analysis instead of re-grading.
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
