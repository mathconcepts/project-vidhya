/**
 * Unit tests for the admin concept search + objectives stub.
 *
 * Pure-function helpers; no DB, no LLM. The route handlers are
 * exercised in admin-runs-routes.test.ts pattern (auth gate +
 * required-param validation) — kept light here.
 */

import { describe, it, expect } from 'vitest';
import { __testing } from '../admin-concepts-routes';

const { searchConcepts, generateObjectivesStub } = __testing;

describe('searchConcepts (gate-ma)', () => {
  it('returns empty for an unknown exam', () => {
    expect(searchConcepts('not-an-exam', 'eigen', 10)).toEqual([]);
  });

  it('empty query returns first N concepts in syllabus order', () => {
    const r = searchConcepts('gate-ma', '', 5);
    expect(r.length).toBe(5);
    expect(r[0].concept_id).toBeTruthy();
  });

  it('exact prefix on concept_id scores 1.0', () => {
    const r = searchConcepts('gate-ma', 'eigen', 10);
    const eigen = r.find((h) => h.concept_id.startsWith('eigen'));
    expect(eigen).toBeDefined();
    expect(eigen!.score).toBe(1.0);
  });

  it('respects the limit', () => {
    const r = searchConcepts('gate-ma', '', 3);
    expect(r.length).toBe(3);
  });

  it('orders prefix matches above substring matches', () => {
    const r = searchConcepts('gate-ma', 'matrix', 10);
    if (r.length >= 2) {
      // Highest score first
      expect(r[0].score).toBeGreaterThanOrEqual(r[1].score);
    }
  });
});

describe('generateObjectivesStub', () => {
  it('returns 3 default objectives when no kinds supplied', () => {
    const out = generateObjectivesStub('eigenvalues', []);
    expect(out.length).toBe(3);
    expect(out.map((o) => o.blooms_level)).toEqual(['understand', 'apply', 'analyze']);
  });

  it('replaces hyphens with spaces in concept name', () => {
    const out = generateObjectivesStub('linear-algebra', ['intuition']);
    expect(out[0].statement).toContain('linear algebra');
    expect(out[0].statement).not.toContain('linear-algebra');
  });

  it('orders by Bloom\'s natural progression', () => {
    const out = generateObjectivesStub('x', ['common_traps', 'intuition', 'practice']);
    // hits: analyze, understand, apply → ordered: understand, apply, analyze
    expect(out.map((o) => o.blooms_level)).toEqual(['understand', 'apply', 'analyze']);
  });

  it('returns at most 3 objectives', () => {
    const out = generateObjectivesStub('x', [
      'retrieval_prompt', 'intuition', 'worked_example', 'common_traps', 'exam_pattern',
    ]);
    expect(out.length).toBeLessThanOrEqual(3);
  });

  it('numbers objectives sequentially', () => {
    const out = generateObjectivesStub('x', ['intuition', 'practice']);
    expect(out.map((o) => o.id)).toEqual(['obj_1', 'obj_2']);
  });

  it('handles unknown kinds (skipped silently)', () => {
    const out = generateObjectivesStub('x', ['no-such-kind', 'intuition']);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].blooms_level).toBe('understand');
  });
});
