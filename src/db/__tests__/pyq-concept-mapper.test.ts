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
import { mapPyqTagsToConceptId, mapPyqTextToConceptId, mapPyqToConceptId } from '../pyq-concept-mapper';
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
  it('the original 15 linear-algebra PYQs (from data/courses/gate-em/topics/01-linear-algebra) resolve — none stay null', () => {
    const { topic, questions } = loadTopicMcqs('01-linear-algebra');
    const original15 = questions.filter((q: any) => !q.id.startsWith('la-0') || Number(q.id.slice(3)) <= 15);
    const unresolved = original15.filter((q: any) => mapPyqTagsToConceptId(topic, q.tags) === null);
    expect(unresolved.map((q: any) => q.id)).toEqual([]);
  });
  it('la-016..la-029 (14 new exam-style questions for the 7 previously-uncovered concepts) mostly resolve via secondary tags, but the mapper has not been taught their new PRIMARY tags yet — that is a separate lane\'s job (see CLAUDE.md §"Gap 1"), so la-016/la-017 (inner-product-spaces) honestly stay null rather than guess', () => {
    const { topic, questions } = loadTopicMcqs('01-linear-algebra');
    const newBatch = questions.filter((q: any) => q.id.startsWith('la-0') && Number(q.id.slice(3)) >= 16);
    expect(newBatch.length).toBe(14);
    const unresolved = newBatch.filter((q: any) => mapPyqTagsToConceptId(topic, q.tags) === null);
    expect(unresolved.map((q: any) => q.id)).toEqual(['la-016', 'la-017']);
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
