/**
 * masteryState() threshold table (T4 / Milestone A).
 *
 * Locks two changes:
 *   1. learningN recalibrated 5 -> 2 — content-gate.ts / syllabus-context.ts
 *      both treat 'not-started' | 'learning' as BLOCKING a prereq edge, and
 *      a thin catalog meant threshold=5 kept most prereqs locked forever.
 *   2. The dead 'at-risk' branch (a query against a nonexistent
 *      `objects_for_skill($2)` function, behind a swallowed .catch()) is
 *      deleted — a mastered skill now always reports 'mastered', not a
 *      state that was unreachable dead code anyway.
 *
 * Mocks `pg` (same pattern as src/content/__tests__/atom-loader-media.test.ts)
 * since there's no live Postgres in this environment.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockQuery })),
  },
}));

function mockAbility(rating: number | null, n: number | null) {
  if (rating === null || n === null) {
    // No row — abilityFor() falls back to newStudentAbility (n=0, rating=1500 default).
    mockQuery.mockResolvedValueOnce({ rows: [] });
  } else {
    mockQuery.mockResolvedValueOnce({ rows: [{ rating, n }] });
  }
}

describe('PgStudentModel.masteryState — threshold table', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    process.env.DATABASE_URL = 'postgres://test';
  });

  it('n=0 (no row at all) -> not-started', async () => {
    const { PgStudentModel } = await import('../student-model-pg');
    mockAbility(null, null);
    const state = await new PgStudentModel().masteryState('s1', 'k1');
    expect(state).toBe('not-started');
    expect(mockQuery).toHaveBeenCalledTimes(1); // no second query — the dead at-risk branch is gone
  });

  it('n=1 -> learning (below the recalibrated learningN=2 floor)', async () => {
    const { PgStudentModel } = await import('../student-model-pg');
    mockAbility(1500, 1);
    const state = await new PgStudentModel().masteryState('s1', 'k1');
    expect(state).toBe('learning');
  });

  it('n=2, low rating -> learning (n floor cleared, rating floor not)', async () => {
    const { PgStudentModel } = await import('../student-model-pg');
    mockAbility(1300, 2);
    const state = await new PgStudentModel().masteryState('s1', 'k1');
    expect(state).toBe('learning');
  });

  it('n=2, rating exactly at practicingRating (1400) -> practicing', async () => {
    const { PgStudentModel } = await import('../student-model-pg');
    mockAbility(1400, 2);
    const state = await new PgStudentModel().masteryState('s1', 'k1');
    expect(state).toBe('practicing');
  });

  it('n=2, rating just below practicingRating (1399) -> learning', async () => {
    const { PgStudentModel } = await import('../student-model-pg');
    mockAbility(1399, 2);
    const state = await new PgStudentModel().masteryState('s1', 'k1');
    expect(state).toBe('learning');
  });

  it('rating just below masteredRating (1699) -> practicing', async () => {
    const { PgStudentModel } = await import('../student-model-pg');
    mockAbility(1699, 10);
    const state = await new PgStudentModel().masteryState('s1', 'k1');
    expect(state).toBe('practicing');
  });

  it('rating exactly at masteredRating (1700) -> mastered', async () => {
    const { PgStudentModel } = await import('../student-model-pg');
    mockAbility(1700, 10);
    const state = await new PgStudentModel().masteryState('s1', 'k1');
    expect(state).toBe('mastered');
  });

  it('high n and high rating -> mastered, and never queries fsrs_cards (dead at-risk branch removed)', async () => {
    const { PgStudentModel } = await import('../student-model-pg');
    mockAbility(2000, 50);
    const state = await new PgStudentModel().masteryState('s1', 'k1');
    expect(state).toBe('mastered');
    // Only the single student_skill_elo lookup — no second query at all,
    // proving the old `objects_for_skill($2)` call site is gone, not just
    // swallowed by its old .catch().
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery.mock.calls[0][0]).toContain('student_skill_elo');
  });

  it('n satisfies learningN but not enough for practicing at the exact boundary n=2', async () => {
    const { PgStudentModel } = await import('../student-model-pg');
    mockAbility(1500, 2);
    const state = await new PgStudentModel().masteryState('s1', 'k1');
    expect(state).toBe('practicing');
  });
});
