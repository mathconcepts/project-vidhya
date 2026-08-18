/**
 * recordProblemAttempt's UUID guard (T21 — outside-voice amendment 4,
 * docs/designs/linear-algebra-realtime-and-math-academy-plan.md).
 *
 * `generated_problems.id` is a UUID column; `WHERE id = $1` against a
 * TEXT id like an authored practice-item id (`la-eigen-trace-det-001`)
 * used to throw on every call, silently swallowed by callers' `.catch()`.
 * The fix no-ops for non-UUID ids before ever touching the pool.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: { Pool: vi.fn(() => ({ query: mockQuery })) },
}));

import { recordProblemAttempt } from '../problem-generator';

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ rows: [] });
});

describe('recordProblemAttempt — id-shape guard', () => {
  it('no-ops for a TEXT authored-item id (never touches the pool)', async () => {
    await recordProblemAttempt('la-eigen-trace-det-001', true);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('no-ops for any other non-UUID id shape', async () => {
    await recordProblemAttempt('pi-eigenvalues-a1b2c3d4', false);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('queries as before for a real UUID id', async () => {
    await recordProblemAttempt('123e4567-e89b-12d3-a456-426614174000', true);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('UPDATE generated_problems');
    expect(params).toEqual(['123e4567-e89b-12d3-a456-426614174000', 1]);
  });

  it('accepts a UUID regardless of case', async () => {
    await recordProblemAttempt('123E4567-E89B-12D3-A456-426614174000', false);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});
