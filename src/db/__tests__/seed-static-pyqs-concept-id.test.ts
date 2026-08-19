/**
 * Regression coverage for T3 / Milestone A / A2's changes to
 * seed-static-pyqs.ts: concept_id is now derived at INSERT time, backfilled
 * for already-seeded rows BEFORE the per-topic skip-guard, and backfilled
 * separately for migration 035's untagged linear-algebra rows.
 *
 * Extended (multi-concept mapping / A9): every INSERT and backfill UPDATE
 * now also carries `concept_ids TEXT[]` — the full concept set a question
 * covers (migration 048_pyq_concept_ids.sql), primary-first, alongside the
 * unchanged single `concept_id` primary.
 *
 * Uses the REAL data/courses/gate-em/topics/*​/mcqs.json fixtures (the same
 * ones the running server seeds from) against a fake pg.Pool, so this test
 * fails if either the mapper or the wiring regresses.
 */
import { describe, it, expect } from 'vitest';
import { seedStaticPyqQuestions } from '../seed-static-pyqs';

interface Call { sql: string; params: any[] }

function makeFakePool() {
  const calls: Call[] = [];
  const pool = {
    query: async (sql: string, params: any[] = []) => {
      calls.push({ sql, params });
      const normalized = sql.replace(/\s+/g, ' ').trim();
      if (normalized.startsWith('SELECT COUNT(*) AS n FROM pyq_questions WHERE topic')) {
        // Simulate an empty DB — every topic takes the INSERT path.
        return { rows: [{ n: '0' }] };
      }
      if (normalized.startsWith('UPDATE pyq_questions SET concept_id')) {
        return { rowCount: 0 };
      }
      if (normalized.startsWith('INSERT INTO pyq_questions')) {
        return { rows: [] };
      }
      if (normalized.startsWith('SELECT id, question_text FROM pyq_questions')) {
        // Simulate an empty DB — no migration-035 rows to backfill here.
        return { rows: [] };
      }
      return { rows: [] };
    },
  };
  return { pool, calls };
}

describe('seedStaticPyqQuestions — concept_id / concept_ids wiring', () => {
  it('inserts all 164 static PYQs, each with concept_id + concept_ids columns (null or real concepts)', async () => {
    const { pool, calls } = makeFakePool();
    const seeded = await seedStaticPyqQuestions(pool as any);

    expect(seeded).toBe(164);

    const inserts = calls.filter(c => c.sql.includes('INSERT INTO pyq_questions'));
    expect(inserts.length).toBe(164);

    // Every INSERT carries exactly 12 params: concept_id at [10], concept_ids at [11].
    for (const call of inserts) {
      expect(call.params.length).toBe(12);
    }

    const withConcept = inserts.filter(c => c.params[10] !== null);
    const withoutConcept = inserts.filter(c => c.params[10] === null);
    // Verified count (see pyq-concept-mapper.test.ts): 148/150 resolve,
    // 2 stay honestly unmapped (differential-equations de-006, an
    // order/degree question; probability-statistics ps-013, a
    // Chebyshev-inequality question — neither has a confident single-concept
    // match in the mapper).
    expect(withConcept.length).toBe(162);
    expect(withoutConcept.length).toBe(2);

    // concept_ids is populated iff concept_id is; unmapped rows carry null
    // for both, never an empty-array guess.
    for (const call of withConcept) {
      expect(Array.isArray(call.params[11])).toBe(true);
      expect(call.params[11].length).toBeGreaterThan(0);
      expect(call.params[11][0]).toBe(call.params[10]); // primary is always element [0]
    }
    for (const call of withoutConcept) {
      expect(call.params[11]).toBeNull();
    }
  });

  it('runs a per-question backfill UPDATE (concept_id + concept_ids) for every topic before the skip-guard', async () => {
    const { pool, calls } = makeFakePool();
    await seedStaticPyqQuestions(pool as any);

    const backfillUpdates = calls.filter(c => c.sql.includes('UPDATE pyq_questions SET concept_id') && c.sql.includes('question_text'));
    // One backfill attempt per question that resolves a concept_id, across
    // all 10 topics — same 162 that resolve on the INSERT path.
    expect(backfillUpdates.length).toBe(162);
    for (const call of backfillUpdates) {
      expect(call.sql).toContain('concept_ids');
      expect(Array.isArray(call.params[1])).toBe(true); // concept_ids param
    }
  });

  it('queries migration 035\'s untagged linear-algebra rows for a separate backfill', async () => {
    const { pool, calls } = makeFakePool();
    await seedStaticPyqQuestions(pool as any);

    const migration035Select = calls.find(c =>
      c.sql.includes("SELECT id, question_text FROM pyq_questions") &&
      c.sql.includes("source = 'generated_tier3'"));
    expect(migration035Select).toBeDefined();
  });

  it('linear-algebra INSERTs carry real LA concept ids (eigenvalues, rank-nullity, ...)', async () => {
    const { pool, calls } = makeFakePool();
    await seedStaticPyqQuestions(pool as any);

    const laInserts = calls.filter(c => c.sql.includes('INSERT INTO pyq_questions') && c.params[6] === 'linear-algebra');
    // 15 original GATE LA questions + 14 authored for the concepts that had
    // no exam-style question at all (la-016..la-029).
    expect(laInserts.length).toBe(29);
    const conceptIds = laInserts.map(c => c.params[10]);
    expect(conceptIds).toContain('eigenvalues');
    expect(conceptIds).toContain('rank-nullity');
    expect(conceptIds.every(id => typeof id === 'string')).toBe(true);
  });

  it('linear-algebra INSERTs carry the FULL multi-concept set in concept_ids, not just the primary', async () => {
    const { pool, calls } = makeFakePool();
    await seedStaticPyqQuestions(pool as any);

    const laInserts = calls.filter(c => c.sql.includes('INSERT INTO pyq_questions') && c.params[6] === 'linear-algebra');
    // la-012 (question_text param [2]) tests systems-of-equations AND
    // rank-nullity AND determinants AND matrix-inverse — see
    // pyq-concept-mapper.test.ts's table-driven LA_EXPECTED.
    const la012 = laInserts.find(c => c.params[2].includes('Ax = b where A = [[1,2],[2,4]]'));
    expect(la012).toBeDefined();
    expect(la012!.params[11]).toEqual(['systems-of-equations', 'rank-nullity', 'determinants', 'matrix-inverse']);

    // A single-concept question (la-001, eigenvalues only) still gets a
    // one-element array, not a bare scalar.
    const la001 = laInserts.find(c => c.params[2].includes('eigenvalues of the matrix A = [[3, 1], [1, 3]]'));
    expect(la001).toBeDefined();
    expect(la001!.params[11]).toEqual(['eigenvalues']);
  });
});
