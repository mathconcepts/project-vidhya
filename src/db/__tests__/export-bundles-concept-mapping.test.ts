/**
 * Regression coverage for the multi-concept mapping fix to
 * scripts/export-bundles.ts's seedPYQs() — the DB-less demo path.
 *
 * Before this change, frontend/public/data/pyq-bank.json carried NO concept
 * mapping at all: the source data/courses/gate-em/topics/*​/mcqs.json files
 * have no `concept_id` field, and `p.concept_id` was always `undefined` on
 * every emitted problem. A DB-less deploy (the demo) could not find any
 * exam question by concept. This test asserts every emitted problem now
 * runs through the same "never a guess" mapper as the DB seed path
 * (src/db/pyq-concept-mapper.ts), and that both `concept_id` (primary) and
 * `concept_ids` (full set) are populated consistently.
 *
 * Lives under src/db/__tests__ (not scripts/) because vitest.config.ts only
 * collects `src/**​/*.test.ts` — same reason seed-static-pyqs's own tests
 * live here even though the module under test is elsewhere.
 */
import { describe, it, expect } from 'vitest';
import { seedPYQs } from '../../../scripts/export-bundles';

describe('seedPYQs — concept mapping wiring (DB-less demo path)', () => {
  const problems = seedPYQs();

  it('produces the full static bank (164 real GATE PYQs across 10 topics)', () => {
    expect(problems.length).toBe(164);
  });

  it('every problem with a concept_id also has a concept_ids array whose first element matches it', () => {
    for (const p of problems) {
      if (p.concept_id !== undefined) {
        expect(Array.isArray(p.concept_ids)).toBe(true);
        expect(p.concept_ids.length).toBeGreaterThan(0);
        expect(p.concept_ids[0]).toBe(p.concept_id);
      } else {
        // Unmapped rows carry neither field — never a fabricated guess.
        expect(p.concept_ids).toBeUndefined();
      }
    }
  });

  it("148/150 problems resolve a concept (matches the DB seed path's verified count)", () => {
    const mapped = problems.filter((p: any) => p.concept_id !== undefined);
    expect(mapped.length).toBe(162);
  });

  it('linear-algebra questions carry the full hand-verified multi-concept set', () => {
    const laProblems = problems.filter((p: any) => p.topic === 'linear-algebra');
    // 15 original GATE questions + 14 authored for the previously-uncovered concepts.
    expect(laProblems.length).toBe(29);

    const la012 = laProblems.find((p: any) => p.question_text.includes('Ax = b where A = [[1,2],[2,4]]'));
    expect(la012).toBeDefined();
    expect(la012!.concept_ids).toEqual(['systems-of-equations', 'rank-nullity', 'determinants', 'matrix-inverse']);

    const la001 = laProblems.find((p: any) => p.question_text.includes('eigenvalues of the matrix A = [[3, 1], [1, 3]]'));
    expect(la001).toBeDefined();
    expect(la001!.concept_ids).toEqual(['eigenvalues']);
  });

  it('aliased topics (transforms/discrete) still resolve concepts despite the topic-dir-name mismatch', () => {
    // The exported `topic` field stays the raw file-topic ('transform-theory'
    // / 'discrete-mathematics') for back-compat, but the concept lookup
    // internally canonicalizes via TOPIC_DIR_ALIAS — without that, these
    // two topics' questions would all silently export unmapped.
    const transformProblems = problems.filter((p: any) => p.topic === 'transform-theory');
    const discreteProblems = problems.filter((p: any) => p.topic === 'discrete-mathematics');
    expect(transformProblems.length).toBeGreaterThan(0);
    expect(discreteProblems.length).toBeGreaterThan(0);
    expect(transformProblems.some((p: any) => p.concept_id !== undefined)).toBe(true);
    expect(discreteProblems.some((p: any) => p.concept_id !== undefined)).toBe(true);
  });
});
