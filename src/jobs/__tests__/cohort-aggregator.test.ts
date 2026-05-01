/**
 * cohort-aggregator — verifies SQL grouping + idempotent upsert.
 *
 * Mocks pg.Pool to assert the query shape (GROUP BY atom_id, error_pct
 * computation, ON CONFLICT upsert). Without a real DB, we verify the
 * aggregator builds the right queries and respects the n_seen >= 1 guard.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockQuery })),
  },
}));

process.env.DATABASE_URL = 'postgres://test';

const { runCohortAggregator } = await import('../cohort-aggregator');

beforeEach(() => {
  mockQuery.mockReset();
});

describe('runCohortAggregator', () => {
  it('runs the aggregate SELECT with last_recall_correct IS NOT NULL filter', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await runCohortAggregator();
    expect(mockQuery).toHaveBeenCalled();
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toMatch(/SELECT atom_id/);
    expect(sql).toMatch(/last_recall_correct IS NOT NULL/);
    expect(sql).toMatch(/GROUP BY atom_id/);
  });

  it('upserts cohort_signals with ON CONFLICT (atom_id) for each row', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          { atom_id: 'a1', errors: '6', corrects: '4' },  // 60% error_pct
          { atom_id: 'a2', errors: '2', corrects: '8' },  // 20% error_pct
        ],
      })
      .mockResolvedValue({ rows: [], rowCount: 1 });
    const result = await runCohortAggregator();
    expect(result.atoms_processed).toBe(2);
    expect(result.rows_upserted).toBe(2);
    // First call is the SELECT; subsequent calls are the upserts
    const upsert1 = mockQuery.mock.calls[1];
    expect(upsert1[0]).toMatch(/INSERT INTO cohort_signals/);
    expect(upsert1[0]).toMatch(/ON CONFLICT \(atom_id\) DO UPDATE/);
    expect(upsert1[1][0]).toBe('a1');
    expect(Number(upsert1[1][1])).toBeCloseTo(0.6, 3);
    expect(upsert1[1][2]).toBe(10); // n_seen = 6 + 4
  });

  it('skips atoms with zero engagements', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          { atom_id: 'empty', errors: 0, corrects: 0 },  // 0 n_seen → skip
          { atom_id: 'has-data', errors: 1, corrects: 1 },
        ],
      })
      .mockResolvedValue({ rows: [], rowCount: 1 });
    const result = await runCohortAggregator();
    expect(result.atoms_processed).toBe(2);
    expect(result.rows_upserted).toBe(1);  // only has-data was upserted
  });

  it('returns zero counts when no engagements exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await runCohortAggregator();
    expect(result.atoms_processed).toBe(0);
    expect(result.rows_upserted).toBe(0);
    expect(typeof result.duration_ms).toBe('number');
  });
});
