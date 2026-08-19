/**
 * Regression coverage for T3 / Milestone A / A2's changes to
 * seed-static-pyqs.ts: concept_id is now derived at INSERT time, backfilled
 * for already-seeded rows BEFORE the per-topic skip-guard, and backfilled
 * separately for migration 035's untagged linear-algebra rows.
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

describe('seedStaticPyqQuestions — concept_id wiring', () => {
  it('inserts all 164 static PYQs, each with a concept_id column (null or a real concept)', async () => {
    const { pool, calls } = makeFakePool();
    const seeded = await seedStaticPyqQuestions(pool as any);

    expect(seeded).toBe(164);

    const inserts = calls.filter(c => c.sql.includes('INSERT INTO pyq_questions'));
    expect(inserts.length).toBe(164);

    // Every INSERT carries exactly 11 params, concept_id last.
    for (const call of inserts) {
      expect(call.params.length).toBe(11);
    }

    const withConcept = inserts.filter(c => c.params[10] !== null);
    const withoutConcept = inserts.filter(c => c.params[10] === null);
    // Verified count (see pyq-concept-mapper.test.ts): 148/150 of the
    // original bank resolve, 2 stay honestly unmapped (differential-equations
    // de-006, an order/degree question; probability-statistics ps-013, a
    // Chebyshev-inequality question — neither has a confident single-concept
    // match in the mapper). 14 new linear-algebra exam-style questions
    // (la-016..la-029, covering the 7 previously-uncovered LA concepts:
    // inner-product-spaces, gram-schmidt, lu-factorization,
    // positive-definite-matrices, svd, jordan-normal-form, matrix-norms)
    // add 12 more resolved (via secondary tags already in TAG_MAPS —
    // their new primary tags aren't wired into the mapper yet, that's a
    // separate lane's job) and 2 more honestly unmapped (la-016, la-017 —
    // inner-product-spaces questions whose only overlapping tag,
    // "orthogonality", isn't a recognized TAG_MAPS key either).
    // 148+12=160, 2+2=4.
    expect(withConcept.length).toBe(160);
    expect(withoutConcept.length).toBe(4);
  });

  it('runs a per-question backfill UPDATE for every topic before the skip-guard', async () => {
    const { pool, calls } = makeFakePool();
    await seedStaticPyqQuestions(pool as any);

    const backfillUpdates = calls.filter(c => c.sql.includes('UPDATE pyq_questions SET concept_id') && c.sql.includes('question_text'));
    // One backfill attempt per question that resolves a concept_id, across
    // all 10 topics — same 160 that resolve on the INSERT path (see above).
    expect(backfillUpdates.length).toBe(160);
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
    // 15 original + 14 new (la-016..la-029, see the header comment above).
    expect(laInserts.length).toBe(29);
    const conceptIds = laInserts.map(c => c.params[10]);
    expect(conceptIds).toContain('eigenvalues');
    expect(conceptIds).toContain('rank-nullity');
    // 27 of the 29 resolve to a real concept id string; la-016 and la-017
    // (inner-product-spaces) stay honestly null — see the header comment
    // above for why (their only overlapping tag isn't a recognized
    // TAG_MAPS key yet). Never a silent guess.
    const nonNull = conceptIds.filter((id) => id !== null);
    expect(nonNull.length).toBe(27);
    expect(nonNull.every(id => typeof id === 'string')).toBe(true);
  });
});
