/**
 * Tests for PgStudentModel.masteryStates() — T5/§7's batch mastery-fetch
 * perf fix. eligibleNodes() can need masteryState() for up to ~140
 * (candidate × prereq) pairs per request; this method must answer for ANY
 * number of skillIds in a bounded (<=2) number of SQL round-trips, and
 * agree exactly with masteryState()'s per-skill derivation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockQuery, connect: vi.fn() })),
  },
}));

process.env.DATABASE_URL = 'postgres://test/test';

const { PgStudentModel } = await import('../student-model-pg');

beforeEach(() => {
  mockQuery.mockReset();
});

describe('PgStudentModel.masteryStates', () => {
  it('returns an empty map without querying when skillIds is empty', async () => {
    const model = new PgStudentModel();
    const result = await model.masteryStates('s1', []);
    expect(result.size).toBe(0);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('issues at most 2 SQL queries for 97 concepts', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const model = new PgStudentModel();
    const skillIds = Array.from({ length: 97 }, (_, i) => `concept-${i}`);
    await model.masteryStates('s1', skillIds);
    expect(mockQuery.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('derives not-started for a skill with no rows at all', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const model = new PgStudentModel();
    const result = await model.masteryStates('s1', ['algebra']);
    expect(result.get('algebra')).toBe('not-started');
  });

  it('derives learning for n below the learning threshold (5)', async () => {
    mockQuery.mockResolvedValue({ rows: [{ skill_id: 'algebra', rating: 1500, n: 3 }] });
    const model = new PgStudentModel();
    const result = await model.masteryStates('s1', ['algebra']);
    expect(result.get('algebra')).toBe('learning');
  });

  it('derives practicing above the learning threshold with a mid rating', async () => {
    mockQuery.mockResolvedValue({ rows: [{ skill_id: 'algebra', rating: 1500, n: 10 }] });
    const model = new PgStudentModel();
    const result = await model.masteryStates('s1', ['algebra']);
    expect(result.get('algebra')).toBe('practicing');
  });

  it('derives mastered at/above the mastered rating (no cards → never at-risk in the batch path)', async () => {
    mockQuery.mockResolvedValue({ rows: [{ skill_id: 'algebra', rating: 1750, n: 20 }] });
    const model = new PgStudentModel();
    const result = await model.masteryStates('s1', ['algebra']);
    expect(result.get('algebra')).toBe('mastered');
  });

  it('resolves multiple skills from one batch of rows', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        { skill_id: 'a', rating: 1750, n: 20 },
        { skill_id: 'b', rating: 1500, n: 10 },
        { skill_id: 'c', rating: 1500, n: 1 },
      ],
    });
    const model = new PgStudentModel();
    const result = await model.masteryStates('s1', ['a', 'b', 'c', 'd']);
    expect(result.get('a')).toBe('mastered');
    expect(result.get('b')).toBe('practicing');
    expect(result.get('c')).toBe('learning');
    expect(result.get('d')).toBe('not-started'); // 'd' has no row at all
  });

  it('agrees with masteryState() for the same (no-cards) scenario', async () => {
    // masteryState() issues 2 queries per call: ability, then the
    // objects_for_skill probe (which always throws and is caught to []
    // — see the comment in student-model-pg.ts). Mock both shapes.
    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('student_skill_elo')) {
        return { rows: [{ rating: 1650, n: 8 }] };
      }
      throw new Error('objects_for_skill(...) does not exist');
    });
    const single = new PgStudentModel();
    const singleState = await single.masteryState('s1', 'algebra');

    mockQuery.mockReset();
    mockQuery.mockResolvedValue({ rows: [{ skill_id: 'algebra', rating: 1650, n: 8 }] });
    const batch = new PgStudentModel();
    const batchResult = await batch.masteryStates('s1', ['algebra']);

    expect(batchResult.get('algebra')).toBe(singleState);
    expect(singleState).toBe('practicing');
  });
});
