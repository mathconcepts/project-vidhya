/**
 * Tests the DATABASE_URL-unset guard on PgStudentModel's internal
 * getPool() — T16 (D4 / OV2 #10): a missing DATABASE_URL now fails fast
 * with an explicit message at getPool(), rather than a Pool being
 * constructed anyway and only failing later inside pg's connection attempt.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { __resetSharedPoolForTests } from '../../storage/pool';

vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: vi.fn(), connect: vi.fn() })),
  },
}));

beforeEach(() => {
  __resetSharedPoolForTests();
});

describe('PgStudentModel — getPool() DATABASE_URL guard', () => {
  it('throws an explicit "DATABASE_URL not configured" error rather than constructing a Pool anyway', async () => {
    delete process.env.DATABASE_URL;
    const { PgStudentModel } = await import('../student-model-pg');
    const model = new PgStudentModel();

    await expect(model.abilityFor('s1', 'skill1')).rejects.toThrow('[student-model-pg] DATABASE_URL not configured');
  });
});
