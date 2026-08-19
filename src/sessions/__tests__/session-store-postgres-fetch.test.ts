/**
 * Regression coverage for T3 / Milestone A / A2's fix to
 * PostgresStore.fetchProblemsForConcept (session-store.ts).
 *
 * The OLD query referenced four wrong/absent pyq_questions columns
 * (`concept_id`, `question`, `expected_answer`, and a numeric `difficulty
 * <= $2` comparison against a TEXT column — see
 * supabase/migrations/001_rag_schema.sql:36-50 / 044_pyq_concept_id.sql)
 * and would throw on a real schema, not return an empty result. There's no
 * live Postgres in this environment to prove that literally, so this test
 * mocks `pg` (same pattern as src/content/__tests__/atom-loader-media.test.ts)
 * and asserts the query text + params the fixed method actually sends —
 * plus direct unit tests over the extracted pure bucket-mapping helpers.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { difficultyBucketsUpTo, numericDifficultyFromBucket } from '../session-store';

describe('difficultyBucketsUpTo — numeric maxDifficulty -> TEXT bucket set', () => {
  it('below 0.33 → easy only', () => {
    expect(difficultyBucketsUpTo(0)).toEqual(['easy']);
    expect(difficultyBucketsUpTo(0.32)).toEqual(['easy']);
  });
  it('at the 0.33 boundary → easy + medium (boundary is inclusive of medium)', () => {
    expect(difficultyBucketsUpTo(0.33)).toEqual(['easy', 'medium']);
  });
  it('between 0.33 and 0.66 → easy + medium', () => {
    expect(difficultyBucketsUpTo(0.5)).toEqual(['easy', 'medium']);
    expect(difficultyBucketsUpTo(0.65)).toEqual(['easy', 'medium']);
  });
  it('at the 0.66 boundary and above → all three buckets', () => {
    expect(difficultyBucketsUpTo(0.66)).toEqual(['easy', 'medium', 'hard']);
    expect(difficultyBucketsUpTo(1.0)).toEqual(['easy', 'medium', 'hard']);
  });
});

describe('numericDifficultyFromBucket — TEXT bucket -> representative numeric value', () => {
  it('easy → 0.25 (matches FlatFileStore\'s existing convention)', () => {
    expect(numericDifficultyFromBucket('easy')).toBe(0.25);
  });
  it('hard → 0.75', () => {
    expect(numericDifficultyFromBucket('hard')).toBe(0.75);
  });
  it('medium (and any other/missing value) → 0.5', () => {
    expect(numericDifficultyFromBucket('medium')).toBe(0.5);
    expect(numericDifficultyFromBucket(null)).toBe(0.5);
    expect(numericDifficultyFromBucket(undefined)).toBe(0.5);
  });
});

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockQuery })),
  },
}));

describe('PostgresStore.fetchProblemsForConcept — fixed query shape', () => {
  const prevDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    mockQuery.mockReset();
    process.env.DATABASE_URL = 'postgres://test';
  });

  afterEach(() => {
    if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
    else delete process.env.DATABASE_URL;
    vi.resetModules();
  });

  it('queries question_text/correct_answer/concept_id and a bucket-array difficulty filter — never the old broken shape', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'uuid-1', topic: 'linear-algebra', difficulty: 'easy',
        question_text: 'What is det(I)?', correct_answer: '1',
        source: 'official_pyq', source_url: null,
      }],
    });

    vi.resetModules();
    const { getSessionStore, _resetSessionStoreForTests } = await import('../session-store');
    _resetSessionStoreForTests();
    const store = getSessionStore();
    expect(store.constructor.name).toBe('PostgresStore');

    const result = await store.fetchProblemsForConcept('determinants', 0.4, new Set(['excluded-uuid']));

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];

    // The fixed query must reference the REAL columns...
    expect(sql).toContain('question_text');
    expect(sql).toContain('correct_answer');
    expect(sql).toContain('concept_id');
    expect(sql).toContain('difficulty = ANY($2::text[])');
    // ...and must NOT contain the old broken shape (bare `question,` /
    // `expected_answer,` column refs, or a numeric `difficulty <= $2`).
    expect(sql).not.toMatch(/\bquestion,/);
    expect(sql).not.toMatch(/\bexpected_answer\b/);
    expect(sql).not.toContain('difficulty <= $2');

    // Params: concept id, the bucket array (not a raw number), exclude list.
    expect(params[0]).toBe('determinants');
    expect(params[1]).toEqual(['easy', 'medium']); // difficultyBucketsUpTo(0.4)
    expect(params[2]).toEqual(['excluded-uuid']);

    // Result mapping: question_text -> question, correct_answer -> expected_answer,
    // difficulty bucket -> numeric.
    expect(result).toEqual({
      problem_id: 'uuid-1',
      concept_id: 'determinants',
      topic: 'linear-algebra',
      difficulty: 0.25,
      question: 'What is det(I)?',
      expected_answer: '1',
      source: 'official_pyq',
      source_url: null,
    });
  });

  it('matches the array too: WHERE (concept_id = $1 OR $1 = ANY(concept_ids))', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    vi.resetModules();
    const { getSessionStore, _resetSessionStoreForTests } = await import('../session-store');
    _resetSessionStoreForTests();
    const store = getSessionStore();

    await store.fetchProblemsForConcept('matrix-inverse', 0.5, new Set());

    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toContain('WHERE (concept_id = $1 OR $1 = ANY(concept_ids))');
  });

  it('returns null (not a throw) when no row matches', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    vi.resetModules();
    const { getSessionStore, _resetSessionStoreForTests } = await import('../session-store');
    _resetSessionStoreForTests();
    const store = getSessionStore();
    const result = await store.fetchProblemsForConcept('eigenvalues', 1.0, new Set());
    expect(result).toBeNull();
  });
});
