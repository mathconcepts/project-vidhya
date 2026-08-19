/**
 * Tests for src/db/pyq-concept-mapper.ts (T3 / Milestone A / A2).
 *
 * The tag-based tests load the REAL data/courses/gate-em/topics/*​/mcqs.json
 * files and assert every question's real tags resolve to a real concept id
 * from data/curriculum/gate-ma.yml (via ALL_CONCEPTS) — this catches both
 * mapper bugs and drift if the source files ever change. The text-based
 * tests hardcode the 11 verified substrings from migration
 * 035_generated_content_provenance.sql (those rows are static SQL, not a
 * live file this test can re-read).
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  mapPyqTagsToConceptId,
  mapPyqTagsToConceptIds,
  mapPyqTextToConceptId,
  mapPyqTextToConceptIds,
  mapPyqToConceptId,
  mapPyqToConceptIds,
} from '../pyq-concept-mapper';
import { ALL_CONCEPTS } from '../../constants/concept-graph';

const CONCEPT_IDS = new Set(ALL_CONCEPTS.map(c => c.id));
const TOPICS_DIR = path.resolve(__dirname, '../../../data/courses/gate-em/topics');

function loadTopicMcqs(dirName: string): { topic: string; questions: any[] } {
  const raw = JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, dirName, 'mcqs.json'), 'utf-8'));
  return { topic: raw.topic, questions: raw.questions };
}

describe('mapPyqTagsToConceptId — every real question resolves to a real concept or null (never a guess)', () => {
  const dirs = fs.readdirSync(TOPICS_DIR).filter(d => fs.statSync(path.join(TOPICS_DIR, d)).isDirectory());

  for (const dirName of dirs) {
    const { topic, questions } = loadTopicMcqs(dirName);
    describe(`topic: ${topic}`, () => {
      for (const q of questions) {
        it(`${q.id}: resolves to a real concept id or null`, () => {
          const result = mapPyqTagsToConceptId(topic, q.tags);
          if (result !== null) {
            expect(CONCEPT_IDS.has(result)).toBe(true);
          }
        });
      }
    });
  }
});

describe('mapPyqTagsToConceptId — linear-algebra, spot-checked against real question content', () => {
  it('la-001 (eigenvalues of a 2x2 symmetric matrix) → eigenvalues', () => {
    expect(mapPyqTagsToConceptId('linear-algebra', ['eigenvalues', 'characteristic-equation', 'linear-algebra'])).toBe('eigenvalues');
  });
  it('la-002 (infinitely-many-solutions system) → systems-of-equations', () => {
    expect(mapPyqTagsToConceptId('linear-algebra', ['system-of-equations', 'consistency', 'rank', 'linear-algebra'])).toBe('systems-of-equations');
  });
  it('la-003 (rank-nullity theorem) → rank-nullity', () => {
    expect(mapPyqTagsToConceptId('linear-algebra', ['rank-nullity', 'null-space', 'linear-algebra'])).toBe('rank-nullity');
  });
  it('la-007 (basis for R^3) → vector-spaces', () => {
    expect(mapPyqTagsToConceptId('linear-algebra', ['basis', 'vector-spaces', 'linear-independence', 'linear-algebra'])).toBe('vector-spaces');
  });
  it('la-008 (invertible matrix, unique solution) → matrix-inverse', () => {
    expect(mapPyqTagsToConceptId('linear-algebra', ['invertible-matrix', 'system-of-equations', 'linear-algebra'])).toBe('matrix-inverse');
  });
  it('la-013 (orthogonal matrix property) → orthogonality', () => {
    expect(mapPyqTagsToConceptId('linear-algebra', ['orthogonal-matrix', 'matrix-inverse', 'linear-algebra'])).toBe('orthogonality');
  });
  it('la-015 (quadratic form matrix) → quadratic-forms', () => {
    expect(mapPyqTagsToConceptId('linear-algebra', ['quadratic-forms', 'symmetric-matrix', 'matrices', 'linear-algebra'])).toBe('quadratic-forms');
  });
  it('all 15 linear-algebra PYQs (from data/courses/gate-em/topics/01-linear-algebra) resolve — none stay null', () => {
    const { topic, questions } = loadTopicMcqs('01-linear-algebra');
    const unresolved = questions.filter((q: any) => mapPyqTagsToConceptId(topic, q.tags) === null);
    expect(unresolved.map((q: any) => q.id)).toEqual([]);
  });
});

describe('mapPyqTagsToConceptId — differential-equations, homogeneous-ode disambiguation', () => {
  // de-013 tests dy/dx = (x+y)/(x-y): a first-order homogeneous ODE
  // (dy/dx = F(y/x) form), NOT the second-order "RHS=0" sense the tag name
  // suggests — the mapper must resolve it to ode-first-order, not
  // ode-second-order-homo.
  it('homogeneous-ode (first-order dy/dx=F(y/x) form) → ode-first-order, not ode-second-order-homo', () => {
    expect(mapPyqTagsToConceptId('differential-equations', ['homogeneous-ode', 'first-order-ode', 'classification', 'differential-equations']))
      .toBe('ode-first-order');
  });
  it('second-order-ode with characteristic-equation → ode-second-order-homo', () => {
    expect(mapPyqTagsToConceptId('differential-equations', ['second-order-ode', 'characteristic-equation', 'repeated-roots']))
      .toBe('ode-second-order-homo');
  });
  it('non-homogeneous-ode → ode-second-order-nonhomo', () => {
    expect(mapPyqTagsToConceptId('differential-equations', ['non-homogeneous-ode', 'resonance', 'undetermined-coefficients']))
      .toBe('ode-second-order-nonhomo');
  });
});

describe('mapPyqTagsToConceptId — canonical (post-TOPIC_DIR_ALIAS) topic keys', () => {
  it('transforms (not transform-theory) resolves laplace tags', () => {
    expect(mapPyqTagsToConceptId('transforms', ['laplace', 'shifting-theorem'])).toBe('laplace-transform');
    expect(mapPyqTagsToConceptId('transform-theory', ['laplace', 'shifting-theorem'])).toBeNull();
  });
  it('discrete (not discrete-mathematics) resolves logic tags', () => {
    expect(mapPyqTagsToConceptId('discrete', ['logic', 'tautology'])).toBe('propositional-logic');
    expect(mapPyqTagsToConceptId('discrete-mathematics', ['logic', 'tautology'])).toBeNull();
  });
});

describe('mapPyqTagsToConceptId — honest degradation', () => {
  it('returns null for an unknown topic', () => {
    expect(mapPyqTagsToConceptId('astrology', ['eigenvalues'])).toBeNull();
  });
  it('returns null for empty/missing tags', () => {
    expect(mapPyqTagsToConceptId('linear-algebra', [])).toBeNull();
    expect(mapPyqTagsToConceptId('linear-algebra', undefined)).toBeNull();
    expect(mapPyqTagsToConceptId('linear-algebra', null)).toBeNull();
  });
  it('returns null when no tag in the array is recognized (never guesses)', () => {
    expect(mapPyqTagsToConceptId('linear-algebra', ['totally-unrecognized-tag'])).toBeNull();
  });
});

describe('mapPyqTextToConceptId — migration 035\'s 11 untagged linear-algebra rows', () => {
  const cases: Array<[string, string]> = [
    ['For any square matrix A, the matrix (A + Aᵀ) is always:', 'symmetric-matrices'],
    ['For any two n×n matrices A and B (product defined), trace(AB) equals:', 'trace'],
    ['A is a 3×3 matrix with det(A) = 5. Then det(A⁻¹) is:', 'determinants'],
    ['The system  x + 3y = 4,  2x + 6y = k  has infinitely many solutions when k equals:', 'systems-of-equations'],
    ['has eigenvalues 1 and 3. For λ = 3, an eigenvector is proportional to:', 'eigenvalues'],
    ['The Cayley–Hamilton theorem states that:', 'cayley-hamilton'],
    ['A square matrix A is called orthogonal when:', 'orthogonality'],
    ['A is idempotent, meaning A² = A. Every eigenvalue of A must be:', 'eigenvalues'],
    ['In the LU decomposition A = LU (Doolittle form), L and U are:', 'lu-factorization'],
    ['For an m×n matrix A, the rank–nullity theorem states:', 'rank-nullity'],
    ['Are the vectors (1,2,3), (0,1,4), and (2,3,2) linearly independent in ℝ³?', 'linear-independence'],
  ];

  for (const [text, expected] of cases) {
    it(`"${text.slice(0, 50)}…" → ${expected}`, () => {
      expect(mapPyqTextToConceptId('linear-algebra', text)).toBe(expected);
      expect(CONCEPT_IDS.has(expected)).toBe(true);
    });
  }

  it('returns null for unrelated text', () => {
    expect(mapPyqTextToConceptId('linear-algebra', 'What is the capital of France?')).toBeNull();
  });

  it('returns null for a topic with no text rules', () => {
    expect(mapPyqTextToConceptId('calculus', 'trace(AB) equals')).toBeNull();
  });
});

describe('mapPyqTextToConceptIds — the 8 SQL-seeded linear-algebra rows (no tags column at all)', () => {
  // Exact question_text as it appears in the exported bundle (verified
  // against frontend/public/data/pyq-bank.json before writing the rules).
  const cases: Array<[string, string, string[]]> = [
    ['sql-GATE-PYQs-Seed-1', 'The eigenvalues of the matrix [[2, 1], [1, 2]] are:', ['eigenvalues']],
    ['sql-GATE-PYQs-Seed-2', 'The rank of the matrix [[1, 2, 3], [2, 4, 6], [1, 2, 4]] is:', ['rank-nullity']],
    ['sql-GATE-PYQs-Seed-3', 'If A is a 3×3 matrix with det(A) = 5, then det(2A) is:', ['determinants']],
    ['sql-GATE-PYQs-Seed-4', 'The system of equations x + y + z = 6, x + 2y + 3z = 14, x + 4y + 7z = 30 has:', ['systems-of-equations', 'rank-nullity']],
    ['sql-GATE-PYQs-Seed-5', 'The product of eigenvalues of [[1, 0, 0], [0, 3, -1], [0, -1, 3]] is:', ['eigenvalues', 'determinants']],
    ['sql-Supabase-PYQs-Seed-1', 'The eigenvalues of the matrix [[3, 1], [0, 3]] are', ['eigenvalues']],
    ['sql-Supabase-PYQs-Seed-2', 'The rank of the matrix [[1,2,3],[4,5,6],[7,8,9]] is', ['rank-nullity']],
    ['sql-Supabase-PYQs-Seed-3', 'If A is an n×n matrix with det(A) = 0, then the system Ax = b', ['determinants', 'matrix-inverse', 'systems-of-equations']],
  ];

  for (const [id, text, expected] of cases) {
    it(`${id}: "${text.slice(0, 55)}…" → ${JSON.stringify(expected)}`, () => {
      expect(mapPyqTextToConceptIds('linear-algebra', text)).toEqual(expected);
      for (const conceptId of expected) expect(CONCEPT_IDS.has(conceptId)).toBe(true);
    });
  }

  it('mapPyqTextToConceptId (single) still returns the primary — element [0]', () => {
    expect(mapPyqTextToConceptId('linear-algebra', 'The product of eigenvalues of [[1, 0, 0], [0, 3, -1], [0, -1, 3]] is:'))
      .toBe('eigenvalues');
  });

  it('returns [] for unrelated text', () => {
    expect(mapPyqTextToConceptIds('linear-algebra', 'What is the capital of France?')).toEqual([]);
  });
});

describe('mapPyqToConceptId — combined tag-then-text fallback', () => {
  it('prefers tag match when both would resolve', () => {
    expect(mapPyqToConceptId('linear-algebra', ['eigenvalues'], 'trace(AB) equals')).toBe('eigenvalues');
  });
  it('falls back to text match when tags are absent', () => {
    expect(mapPyqToConceptId('linear-algebra', undefined, 'trace(AB) equals:')).toBe('trace');
  });
  it('returns null when neither strategy matches', () => {
    expect(mapPyqToConceptId('linear-algebra', [], 'unrelated text')).toBeNull();
  });
});

describe('mapPyqTagsToConceptIds — multi-concept mapping', () => {
  it('a single-concept tag still returns a one-element array', () => {
    expect(mapPyqTagsToConceptIds('linear-algebra', ['eigenvalues', 'characteristic-equation'])).toEqual(['eigenvalues']);
  });

  it('preserves the pre-multi-concept primary as element [0]', () => {
    const tags = ['symmetric-matrix', 'eigenvalues', 'spectral-theorem', 'linear-algebra'];
    const ids = mapPyqTagsToConceptIds('linear-algebra', tags);
    expect(ids[0]).toBe(mapPyqTagsToConceptId('linear-algebra', tags));
  });

  it('collects concepts from a multi-concept tag in the order listed in TAG_MAPS', () => {
    // la-010: rotation-matrix → [eigenvalues, linear-transformations]
    expect(mapPyqTagsToConceptIds('linear-algebra', ['eigenvalues', 'rotation-matrix', 'complex-eigenvalues']))
      .toEqual(['eigenvalues', 'linear-transformations']);
  });

  it('dedups a concept reachable via two different tags, keeping first-seen order', () => {
    // 'eigenvalues' tag adds eigenvalues; 'rotation-matrix' would add it again — must not duplicate.
    const ids = mapPyqTagsToConceptIds('linear-algebra', ['eigenvalues', 'rotation-matrix']);
    expect(ids.filter(id => id === 'eigenvalues').length).toBe(1);
    expect(ids).toEqual(['eigenvalues', 'linear-transformations']);
  });

  it('an unrecognized tag contributes nothing and does not break resolution of the rest', () => {
    expect(mapPyqTagsToConceptIds('linear-algebra', ['totally-unrecognized-tag', 'eigenvalues'])).toEqual(['eigenvalues']);
  });

  it('unknown topic refuses with [], never a guess', () => {
    expect(mapPyqTagsToConceptIds('astrology', ['eigenvalues'])).toEqual([]);
  });

  it('empty/missing tags refuse with []', () => {
    expect(mapPyqTagsToConceptIds('linear-algebra', [])).toEqual([]);
    expect(mapPyqTagsToConceptIds('linear-algebra', undefined)).toEqual([]);
    expect(mapPyqTagsToConceptIds('linear-algebra', null)).toEqual([]);
  });

  it('every id in every result is a real concept id from ALL_CONCEPTS (no orphan ids)', () => {
    const dirs = fs.readdirSync(TOPICS_DIR).filter(d => fs.statSync(path.join(TOPICS_DIR, d)).isDirectory());
    for (const dirName of dirs) {
      const { topic, questions } = loadTopicMcqs(dirName);
      for (const q of questions) {
        for (const id of mapPyqTagsToConceptIds(topic, q.tags)) {
          expect(CONCEPT_IDS.has(id)).toBe(true);
        }
      }
    }
  });

  // Table-driven: every one of the 15 real GATE linear-algebra PYQs
  // (data/courses/gate-em/topics/01-linear-algebra/mcqs.json) resolves to
  // its full, hand-verified concept set — not just a primary concept.
  const LA_EXPECTED: Record<string, string[]> = {
    'la-001': ['eigenvalues'],
    'la-002': ['systems-of-equations', 'rank-nullity'],
    'la-003': ['rank-nullity', 'null-space-column-space'],
    'la-004': ['eigenvalues', 'determinants', 'matrix-inverse'],
    'la-005': ['symmetric-matrices', 'eigenvalues', 'spectral-theorem'],
    'la-006': ['determinants', 'linear-independence', 'matrix-operations'],
    'la-007': ['vector-spaces', 'change-of-basis', 'linear-independence'],
    'la-008': ['matrix-inverse', 'systems-of-equations'],
    'la-009': ['determinants', 'matrix-inverse', 'eigenvalues'],
    'la-010': ['eigenvalues', 'linear-transformations'],
    'la-011': ['trace', 'eigenvalues', 'diagonalization', 'cayley-hamilton'],
    'la-012': ['systems-of-equations', 'rank-nullity', 'determinants', 'matrix-inverse'],
    'la-013': ['orthogonality', 'matrix-inverse'],
    'la-014': ['systems-of-equations', 'least-squares', 'rank-nullity', 'null-space-column-space'],
    'la-015': ['quadratic-forms', 'symmetric-matrices', 'matrix-operations'],
  };

  it('all 15 linear-algebra PYQs resolve to their full, hand-verified concept set', () => {
    const { questions } = loadTopicMcqs('01-linear-algebra');
    expect(questions.length).toBe(15);
    for (const q of questions) {
      expect(mapPyqTagsToConceptIds('linear-algebra', q.tags)).toEqual(LA_EXPECTED[q.id]);
    }
  });
});

// Wiring for la-016..la-029 — 14 new questions a sibling content lane adds
// to data/courses/gate-em/topics/01-linear-algebra/mcqs.json (arrives via a
// separate merge, not present in this branch's mcqs.json). These cases
// exercise the tag rules ahead of that merge so the wiring is provably
// correct the moment the questions land, without depending on the file.
describe('mapPyqTagsToConceptIds — the 7 previously-uncovered LA concepts (la-016..la-029 primary tags)', () => {
  const primaryCases: Array<[string, string]> = [
    ['inner-product', 'inner-product-spaces'],
    ['gram-schmidt', 'gram-schmidt'],
    ['lu-decomposition', 'lu-factorization'],
    ['positive-definite', 'positive-definite-matrices'],
    ['svd', 'svd'],
    ['jordan-form', 'jordan-normal-form'],
    ['matrix-norm', 'matrix-norms'],
  ];

  for (const [tag, expectedConcept] of primaryCases) {
    it(`'${tag}' tag (primary) → ${expectedConcept}`, () => {
      expect(mapPyqTagsToConceptIds('linear-algebra', [tag])).toEqual([expectedConcept]);
      expect(CONCEPT_IDS.has(expectedConcept)).toBe(true);
    });
  }

  it('all 7 newly-covered concepts are real gate-ma.yml concept ids', () => {
    for (const [, expectedConcept] of primaryCases) {
      expect(CONCEPT_IDS.has(expectedConcept)).toBe(true);
    }
  });

  // Secondary tags reported present on the same 14 questions — re-verified
  // against the current table (some pre-existed, some are new entries
  // added alongside the 7 primaries above).
  const secondaryCases: Array<[string, string]> = [
    ['orthogonality', 'orthogonality'],
    ['vector-spaces', 'vector-spaces'],
    ['linear-independence', 'linear-independence'],
    ['matrices', 'matrix-operations'],
    ['determinant', 'determinants'],
    ['eigenvalues', 'eigenvalues'],
    ['symmetric-matrix', 'symmetric-matrices'],
    ['rank', 'rank-nullity'],
    ['diagonalization', 'diagonalization'],
    ['svd', 'svd'],
  ];
  for (const [tag, expectedConcept] of secondaryCases) {
    it(`secondary tag '${tag}' still resolves sensibly → ${expectedConcept}`, () => {
      expect(mapPyqTagsToConceptIds('linear-algebra', [tag])).toEqual([expectedConcept]);
    });
  }

  it("'vectors' is deliberately unmapped — too generic to name a concept, same as bare 'linear-algebra'", () => {
    expect(mapPyqTagsToConceptIds('linear-algebra', ['vectors'])).toEqual([]);
    expect(mapPyqTagsToConceptId('linear-algebra', ['vectors'])).toBeNull();
  });

  it('a plausible la-016..029-style multi-tag question resolves primary-first with secondaries following', () => {
    // e.g. an inner-product-spaces question that also touches
    // orthogonality and vector-spaces as secondary tags.
    expect(mapPyqTagsToConceptIds('linear-algebra', ['inner-product', 'orthogonality', 'vector-spaces']))
      .toEqual(['inner-product-spaces', 'orthogonality', 'vector-spaces']);
  });
});

describe('mapPyqToConceptIds — combined multi-concept tag-then-text fallback', () => {
  it('prefers the full tag-based set over text when tags resolve', () => {
    expect(mapPyqToConceptIds('linear-algebra', ['eigenvalues', 'rotation-matrix'], 'trace(AB) equals'))
      .toEqual(['eigenvalues', 'linear-transformations']);
  });
  it('falls back to a one-element array from text match when tags are absent', () => {
    expect(mapPyqToConceptIds('linear-algebra', undefined, 'trace(AB) equals:')).toEqual(['trace']);
  });
  it('falls back to text when tags are present but none resolve', () => {
    expect(mapPyqToConceptIds('linear-algebra', ['totally-unrecognized-tag'], 'trace(AB) equals:')).toEqual(['trace']);
  });
  it('returns [] when neither strategy matches', () => {
    expect(mapPyqToConceptIds('linear-algebra', [], 'unrelated text')).toEqual([]);
  });
});
