/**
 * Tests for src/readiness/due-cards.ts (T12 / OV2-D1).
 *
 * Locks:
 *   - dueCards() queries fsrs_cards WHERE due_at <= now AND reps > 0
 *     (never-seen cards are never "due").
 *   - DB-less and query-failure both degrade to [] honestly.
 *   - makeDueReviewSource() maps raw rows through a catalog, skipping
 *     unservable objects and cards with no skill_id, and scopes by
 *     allowedNodes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LearningObject } from '../../core/interfaces';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockQuery })),
  },
}));

beforeEach(() => {
  mockQuery.mockReset();
});

function makeObject(over: Partial<LearningObject> = {}): LearningObject {
  return {
    id: 'obj_1', nodeId: 'eigenvalues', type: 'practice', difficulty: 1500,
    estMinutes: 3, prereqs: [], verification: 'cas_passed', payload: {},
    ...over,
  };
}

describe('dueCards', () => {
  it('DB-less: returns [] without querying', async () => {
    delete process.env.DATABASE_URL;
    const { dueCards } = await import('../due-cards');
    const rows = await dueCards('s1', new Date());
    expect(rows).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('queries fsrs_cards scoped by due_at <= now AND reps > 0', async () => {
    process.env.DATABASE_URL = 'postgres://test/test';
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const { dueCards } = await import('../due-cards');
    const now = new Date('2026-06-20T00:00:00.000Z');
    await dueCards('s1', now);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(String(sql)).toContain('fsrs_cards');
    expect(String(sql)).toContain('due_at <= $2');
    expect(String(sql)).toContain('reps > 0');
    expect(params[0]).toBe('s1');
    expect(params[1]).toBe(now.toISOString());
  });

  it('caps the scan with a LIMIT so an account with hundreds of overdue cards cannot balloon the query', async () => {
    process.env.DATABASE_URL = 'postgres://test/test';
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const { dueCards } = await import('../due-cards');
    await dueCards('s1', new Date());

    const [sql, params] = mockQuery.mock.calls[0];
    expect(String(sql)).toContain('LIMIT $3');
    expect(typeof params[2]).toBe('number');
    expect(params[2]).toBeGreaterThan(0);
    expect(params[2]).toBeLessThanOrEqual(100);
  });

  it('maps rows to the DueCardRow shape', async () => {
    process.env.DATABASE_URL = 'postgres://test/test';
    mockQuery.mockResolvedValueOnce({
      rows: [
        { object_id: 'o1', skill_id: 'eigenvalues', stability: 12.5, last_review_at: '2026-06-01T00:00:00.000Z', reps: 3 },
      ],
    });
    const { dueCards } = await import('../due-cards');
    const rows = await dueCards('s1', new Date('2026-06-20T00:00:00.000Z'));
    expect(rows).toEqual([
      { objectId: 'o1', skillId: 'eigenvalues', stability: 12.5, lastReviewAt: '2026-06-01T00:00:00.000Z', reps: 3 },
    ]);
  });

  it('degrades to [] (not a throw) when the query fails', async () => {
    process.env.DATABASE_URL = 'postgres://test/test';
    mockQuery.mockRejectedValueOnce(new Error('connection refused'));
    const { dueCards } = await import('../due-cards');
    const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const rows = await dueCards('s1', new Date());
    expect(rows).toEqual([]);
    consoleErr.mockRestore();
  });
});

describe('makeDueReviewSource', () => {
  it('DB-less: no rows -> []', async () => {
    delete process.env.DATABASE_URL;
    const { makeDueReviewSource } = await import('../due-cards');
    const catalog = { query: async () => [], getById: async () => makeObject() };
    const source = makeDueReviewSource(catalog);
    const result = await source('s1', new Date(), {});
    expect(result).toEqual([]);
  });

  it('maps a due card to a DueReviewCandidate via the catalog, with a fresh recall', async () => {
    process.env.DATABASE_URL = 'postgres://test/test';
    const lastReviewAt = '2026-06-01T00:00:00.000Z';
    mockQuery.mockResolvedValueOnce({
      rows: [{ object_id: 'o1', skill_id: 'eigenvalues', stability: 5, last_review_at: lastReviewAt, reps: 3 }],
    });
    const { makeDueReviewSource } = await import('../due-cards');
    const obj = makeObject({ id: 'o1', nodeId: 'eigenvalues', estMinutes: 4 });
    const catalog = { query: async () => [], getById: vi.fn(async (id: string) => (id === 'o1' ? obj : null)) };
    const source = makeDueReviewSource(catalog);

    const now = new Date('2026-06-20T00:00:00.000Z'); // well after lastReviewAt -> recall < 1
    const result = await source('s1', now, {});

    expect(result).toHaveLength(1);
    expect(result[0].objectId).toBe('o1');
    expect(result[0].nodeId).toBe('eigenvalues');
    expect(result[0].estMinutes).toBe(4);
    expect(result[0].recall).toBeGreaterThan(0);
    expect(result[0].recall).toBeLessThan(1);
  });

  it('skips a due card whose object the catalog cannot resolve', async () => {
    process.env.DATABASE_URL = 'postgres://test/test';
    mockQuery.mockResolvedValueOnce({
      rows: [{ object_id: 'ghost', skill_id: 'eigenvalues', stability: 5, last_review_at: '2026-06-01T00:00:00.000Z', reps: 3 }],
    });
    const { makeDueReviewSource } = await import('../due-cards');
    const catalog = { query: async () => [], getById: async () => null };
    const source = makeDueReviewSource(catalog);
    const result = await source('s1', new Date('2026-06-20T00:00:00.000Z'), {});
    expect(result).toEqual([]);
  });

  it('skips a due card with no skill_id', async () => {
    process.env.DATABASE_URL = 'postgres://test/test';
    mockQuery.mockResolvedValueOnce({
      rows: [{ object_id: 'o1', skill_id: null, stability: 5, last_review_at: '2026-06-01T00:00:00.000Z', reps: 3 }],
    });
    const { makeDueReviewSource } = await import('../due-cards');
    const catalog = { query: async () => [], getById: async () => makeObject() };
    const source = makeDueReviewSource(catalog);
    const result = await source('s1', new Date('2026-06-20T00:00:00.000Z'), {});
    expect(result).toEqual([]);
  });

  it('scopes by allowedNodes via skillId', async () => {
    process.env.DATABASE_URL = 'postgres://test/test';
    mockQuery.mockResolvedValueOnce({
      rows: [
        { object_id: 'o1', skill_id: 'eigenvalues', stability: 5, last_review_at: '2026-06-01T00:00:00.000Z', reps: 3 },
        { object_id: 'o2', skill_id: 'sequences', stability: 5, last_review_at: '2026-06-01T00:00:00.000Z', reps: 3 },
      ],
    });
    const { makeDueReviewSource } = await import('../due-cards');
    const catalog = {
      query: async () => [],
      getById: async (id: string) => makeObject({ id, nodeId: id === 'o1' ? 'eigenvalues' : 'sequences' }),
    };
    const source = makeDueReviewSource(catalog);
    const result = await source('s1', new Date('2026-06-20T00:00:00.000Z'), { allowedNodes: ['eigenvalues'] });
    expect(result).toHaveLength(1);
    expect(result[0].nodeId).toBe('eigenvalues');
  });

  it('batches catalog lookups concurrently instead of awaiting them one at a time', async () => {
    process.env.DATABASE_URL = 'postgres://test/test';
    mockQuery.mockResolvedValueOnce({
      rows: [
        { object_id: 'o1', skill_id: 'eigenvalues', stability: 5, last_review_at: '2026-06-01T00:00:00.000Z', reps: 3 },
        { object_id: 'o2', skill_id: 'eigenvalues', stability: 5, last_review_at: '2026-06-01T00:00:00.000Z', reps: 3 },
        { object_id: 'o3', skill_id: 'eigenvalues', stability: 5, last_review_at: '2026-06-01T00:00:00.000Z', reps: 3 },
      ],
    });
    const { makeDueReviewSource } = await import('../due-cards');

    let inFlight = 0;
    let maxInFlight = 0;
    const getById = vi.fn(async (id: string) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight--;
      return makeObject({ id, nodeId: 'eigenvalues' });
    });
    const catalog = { query: async () => [], getById };
    const source = makeDueReviewSource(catalog);
    const result = await source('s1', new Date('2026-06-20T00:00:00.000Z'), {});

    expect(getById).toHaveBeenCalledTimes(3);
    expect(maxInFlight).toBeGreaterThan(1); // proves the lookups overlapped, not sequential
    expect(result).toHaveLength(3);
  });

  it('returns [] when the catalog has no getById', async () => {
    process.env.DATABASE_URL = 'postgres://test/test';
    mockQuery.mockResolvedValueOnce({
      rows: [{ object_id: 'o1', skill_id: 'eigenvalues', stability: 5, last_review_at: '2026-06-01T00:00:00.000Z', reps: 3 }],
    });
    const { makeDueReviewSource } = await import('../due-cards');
    const catalog = { query: async () => [] }; // no getById
    const source = makeDueReviewSource(catalog);
    const result = await source('s1', new Date('2026-06-20T00:00:00.000Z'), {});
    expect(result).toEqual([]);
  });
});
