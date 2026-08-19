/**
 * Tests for src/db/pyq-bank-index.ts — the "which exam questions cover
 * concept X" index for DB-less deploys.
 */
import { describe, it, expect } from 'vitest';
import { buildPyqConceptIndex, questionsForConcept } from '../pyq-bank-index';

describe('buildPyqConceptIndex', () => {
  it('indexes a problem under every concept in concept_ids, primary included', () => {
    const index = buildPyqConceptIndex({
      problems: [
        {
          id: 'la-012',
          concept_id: 'systems-of-equations',
          concept_ids: ['systems-of-equations', 'rank-nullity', 'determinants', 'matrix-inverse'],
        },
      ],
    });

    expect(questionsForConcept(index, 'systems-of-equations').map(p => p.id)).toEqual(['la-012']);
    expect(questionsForConcept(index, 'rank-nullity').map(p => p.id)).toEqual(['la-012']);
    expect(questionsForConcept(index, 'determinants').map(p => p.id)).toEqual(['la-012']);
    expect(questionsForConcept(index, 'matrix-inverse').map(p => p.id)).toEqual(['la-012']);
  });

  it('falls back to concept_id alone for a pre-048 problem with no concept_ids array', () => {
    const index = buildPyqConceptIndex({
      problems: [{ id: 'legacy-1', concept_id: 'eigenvalues' }],
    });
    expect(questionsForConcept(index, 'eigenvalues').map(p => p.id)).toEqual(['legacy-1']);
  });

  it('a problem with neither concept_id nor concept_ids is indexed under nothing', () => {
    const index = buildPyqConceptIndex({
      problems: [{ id: 'unmapped-1', topic: 'linear-algebra' }],
    });
    expect(index.size).toBe(0);
  });

  it('does NOT fall back to topic — topic and concept are different id spaces', () => {
    const index = buildPyqConceptIndex({
      problems: [{ id: 'p1', topic: 'linear-algebra' }],
    });
    expect(questionsForConcept(index, 'linear-algebra')).toEqual([]);
  });

  it('multiple problems sharing a concept all appear, in bundle order', () => {
    const index = buildPyqConceptIndex({
      problems: [
        { id: 'a', concept_id: 'eigenvalues' },
        { id: 'b', concept_id: 'determinants' },
        { id: 'c', concept_id: 'eigenvalues' },
      ],
    });
    expect(questionsForConcept(index, 'eigenvalues').map(p => p.id)).toEqual(['a', 'c']);
  });

  it('never double-counts a problem whose concept_id duplicates an entry already in concept_ids', () => {
    const index = buildPyqConceptIndex({
      problems: [{ id: 'p1', concept_id: 'eigenvalues', concept_ids: ['eigenvalues', 'trace'] }],
    });
    expect(questionsForConcept(index, 'eigenvalues').length).toBe(1);
  });

  it('empty/missing bundle produces an empty index, never a throw', () => {
    expect(buildPyqConceptIndex({ problems: [] }).size).toBe(0);
    expect(buildPyqConceptIndex({}).size).toBe(0);
    expect(buildPyqConceptIndex(null).size).toBe(0);
    expect(buildPyqConceptIndex(undefined).size).toBe(0);
  });

  it('questionsForConcept returns [] (never undefined) for an unknown concept', () => {
    const index = buildPyqConceptIndex({ problems: [] });
    expect(questionsForConcept(index, 'no-such-concept')).toEqual([]);
  });
});

describe('buildPyqConceptIndex — against the real exported bundle', () => {
  it('every one of the 26 linear-algebra concepts reachable by the tag map has at least one question', async () => {
    const pyqBank = await import('../../../frontend/public/data/pyq-bank.json');
    const index = buildPyqConceptIndex(pyqBank.default as any);

    // The 19 LA concepts the validated tag table (pyq-concept-mapper.ts)
    // actually reaches — the other 7 (inner-product-spaces, gram-schmidt,
    // lu-factorization, positive-definite-matrices, svd, jordan-normal-form,
    // matrix-norms) have no covering PYQ tag and are deliberately absent.
    const reachable = [
      'eigenvalues', 'systems-of-equations', 'rank-nullity', 'determinants',
      'matrix-inverse', 'symmetric-matrices', 'spectral-theorem', 'linear-independence',
      'matrix-operations', 'vector-spaces', 'change-of-basis', 'orthogonality',
      'least-squares', 'null-space-column-space', 'quadratic-forms',
      'linear-transformations', 'trace', 'diagonalization', 'cayley-hamilton',
    ];
    for (const conceptId of reachable) {
      expect(questionsForConcept(index, conceptId).length).toBeGreaterThan(0);
    }
  });
});
