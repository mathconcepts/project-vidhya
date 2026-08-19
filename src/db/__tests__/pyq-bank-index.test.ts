/**
 * Tests for src/db/pyq-bank-index.ts — the "which exam questions cover
 * concept X" index for DB-less deploys.
 */
import { describe, it, expect } from 'vitest';
import { buildPyqConceptIndex, questionsForConcept } from '../pyq-bank-index';
import { ALL_CONCEPTS } from '../../constants/concept-graph';

const CONCEPT_IDS = new Set(ALL_CONCEPTS.map(c => c.id));

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
  it('every one of the 19 currently-tested linear-algebra concepts has at least one question', async () => {
    const pyqBank = await import('../../../frontend/public/data/pyq-bank.json');
    const index = buildPyqConceptIndex(pyqBank.default as any);

    // The 19 LA concepts the 23 questions IN THIS BRANCH's committed
    // bundle cover today. The mapper's TAG_MAPS already has rules for the
    // other 7 (inner-product-spaces, gram-schmidt, lu-factorization,
    // positive-definite-matrices, svd, jordan-normal-form, matrix-norms —
    // see pyq-concept-mapper.ts's 'inner-product'/'gram-schmidt'/etc.
    // entries) — those 7 stay uncovered here only because the 14
    // questions that carry those tags (la-016..la-029) live in a sibling
    // content lane's branch, not yet merged into this one's mcqs.json.
    // Once merged + the bundle regenerated, all 26 should be reachable —
    // see the "every linear-algebra problem is mapped" invariant below,
    // which derives its expected count from the bundle rather than a
    // hardcoded number, so it keeps holding after that merge.
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

describe('every linear-algebra problem in the committed bundle carries concept_ids', () => {
  // Deliberately derives its expected count from the bundle itself
  // (`laProblems.length`), not a hardcoded number, on EITHER bundle — that
  // count stays true across regenerations rather than needing a manual
  // bump. Today: pyq-bank.json has 23 LA problems (15 tagged mcqs.json
  // questions + 8 SQL-seeded ones resolved via text rules);
  // content-bundle.json has 26 (pyq-bank.json's 23 plus 3 single-concept
  // corpus/textbook-sourced ones pyq-bank.json never carried — a
  // different source union, not a bug; see build-content-bundle.ts's
  // "2. Scraped corpus JSONL" / "3. Generated" sections). Once the
  // sibling la-016..la-029 merge lands and both bundles are regenerated,
  // this same test covers 37 / 40 with no change needed here. This is the
  // invariant, not a one-time snapshot: a future PYQ that slips through
  // unmapped, or that somehow carries an unregistered concept id, fails
  // this test rather than quietly shipping — the unregistered-id half is
  // also enforced upstream at generation time now (build-content-bundle.ts's
  // validateConceptIds / InvalidConceptIdError), so this test is a second,
  // independent check on the actually-committed files.
  for (const [bundleName, bundlePath] of [
    ['pyq-bank.json', '../../../frontend/public/data/pyq-bank.json'],
    // content-bundle.json is what actually gets read at runtime by
    // FlatFileStore.loadBundleProblems() (it's checked before
    // pyq-bank.json) — the invariant has to hold there too, not just on
    // the legacy file, or the DB-less demo path stays broken in practice.
    ['content-bundle.json', '../../../frontend/public/data/content-bundle.json'],
  ] as const) {
    it(`${bundleName}: every topic === 'linear-algebra' problem has a non-empty, all-real concept_ids`, async () => {
      const bundle = await import(bundlePath);
      const problems = ((bundle.default as any).problems ?? []) as any[];
      const laProblems = problems.filter(p => p.topic === 'linear-algebra');

      // Sanity: the bundle actually has linear-algebra questions to check —
      // an empty list would make the assertion below vacuously true.
      expect(laProblems.length).toBeGreaterThan(0);

      const unmapped = laProblems.filter(
        p => !Array.isArray(p.concept_ids) || p.concept_ids.length === 0,
      );
      expect(unmapped.map(p => p.id)).toEqual([]);

      for (const p of laProblems) {
        // concept_id (primary) must always be concept_ids[0] when both are set.
        expect(p.concept_id).toBe(p.concept_ids[0]);
        // Every id must be a REAL registered concept — never a topic label
        // ('linear-algebra') or a plausible-but-unregistered id
        // ('matrix-rank'), the two exact bugs this invariant catches.
        for (const conceptId of p.concept_ids) {
          expect(CONCEPT_IDS.has(conceptId)).toBe(true);
        }
      }
    });
  }
});
