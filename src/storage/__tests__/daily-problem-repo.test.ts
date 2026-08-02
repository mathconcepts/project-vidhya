/**
 * Tests for DailyProblemRepo (CEO plan Phase 0 §5.1). Pg implementation
 * against a mocked pg.Pool that hands back a mocked client (matches the
 * pool.connect() / BEGIN / COMMIT transaction shape).
 */

import { describe, it, expect } from 'vitest';
import { PgDailyProblemRepo, NullDailyProblemRepo } from '../repositories/daily-problem-repo';

function mockPoolWithClient(queryImpl: (sql: string, params?: any[]) => Promise<any>) {
  const client = {
    query: queryImpl,
    release: () => {},
  };
  return { connect: async () => client, calls: () => client } as any;
}

describe('PgDailyProblemRepo', () => {
  it('claims a PYQ: BEGIN, SELECT FOR UPDATE SKIP LOCKED, UPDATE posted_at, COMMIT', async () => {
    const seen: string[] = [];
    const pool = mockPoolWithClient(async (sql: string, params?: any[]) => {
      seen.push(sql.trim().split('\n')[0]);
      if (sql.includes('SELECT * FROM pyq_questions')) {
        return { rows: [{ id: 'pyq_1', topic: 'linear-algebra' }] };
      }
      return { rows: [] };
    });
    const repo = new PgDailyProblemRepo(pool);
    const pyq = await repo.selectAndClaimUnpostedPyq();
    expect(pyq).toEqual({ id: 'pyq_1', topic: 'linear-algebra' });
    expect(seen[0]).toBe('BEGIN');
    expect(seen[1]).toMatch(/SELECT \* FROM pyq_questions/);
    expect(seen[2]).toMatch(/UPDATE pyq_questions SET posted_at = NOW\(\)/);
    expect(seen[3]).toBe('COMMIT');
  });

  it('returns null and rolls back when no unposted PYQs remain', async () => {
    const seen: string[] = [];
    const pool = mockPoolWithClient(async (sql: string) => {
      seen.push(sql.trim().split('\n')[0]);
      if (sql.includes('SELECT * FROM pyq_questions')) return { rows: [] };
      return { rows: [] };
    });
    const repo = new PgDailyProblemRepo(pool);
    expect(await repo.selectAndClaimUnpostedPyq()).toBeNull();
    expect(seen).toEqual(['BEGIN', expect.stringMatching(/SELECT \* FROM pyq_questions/), 'ROLLBACK']);
  });

  it('rolls back and rethrows on a query error mid-transaction', async () => {
    const seen: string[] = [];
    const pool = mockPoolWithClient(async (sql: string) => {
      seen.push(sql.trim().split('\n')[0]);
      if (sql.includes('SELECT * FROM pyq_questions')) {
        return { rows: [{ id: 'pyq_1' }] };
      }
      if (sql.startsWith('UPDATE')) throw new Error('boom');
      return { rows: [] };
    });
    const repo = new PgDailyProblemRepo(pool);
    await expect(repo.selectAndClaimUnpostedPyq()).rejects.toThrow('boom');
    expect(seen).toContain('ROLLBACK');
  });
});

describe('NullDailyProblemRepo', () => {
  it('returns null (postDailyProblem() throws before reaching it in practice)', async () => {
    const repo = new NullDailyProblemRepo();
    expect(await repo.selectAndClaimUnpostedPyq()).toBeNull();
  });
});
