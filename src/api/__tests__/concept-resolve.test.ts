/**
 * Resolving a practice question to the concept whose lesson is worth opening.
 *
 * "Explore this concept" used to point at the topic page, and the code said
 * why: a PYQ carries `topic: "Linear Algebra"` and no concept id, so linking
 * to a lesson would have manufactured a dead end. The topic page renders
 * prose; the interactive widgets live on the lesson page. So the honest link
 * also meant Explore never reached a slider, an animation, or a walkthrough.
 *
 * These tests hold the two things that make closing that gap safe: the match
 * has to be RIGHT (a wrong concept label next to a question is worse than a
 * generic one), and an unresolvable topic still has to degrade to the topic
 * page rather than invent a lesson.
 */
import { describe, it, expect } from 'vitest';
import {
  resolveConcept,
  normaliseTopic,
  conceptKeywords,
  questionNamesConcept,
  distinctiveKeywords,
  type ConceptCandidate,
} from '../concept-resolve-routes';

const c = (id: string, kinds: string[] = [], topic = 'linear-algebra'): ConceptCandidate => ({
  id,
  name: id.replace(/-/g, ' '),
  topic,
  interactive_kinds: kinds,
});

const LA: ConceptCandidate[] = [
  c('eigenvalues', ['simulation', 'manipulable', 'guided_walkthrough']),
  c('determinants', ['simulation', 'manipulable', 'guided_walkthrough']),
  c('orthogonality', ['simulation', 'guided_walkthrough']),
  c('gram-schmidt', ['manipulable']),
  c('rank-nullity'),
  c('trace'),
  c('inner-product-spaces', ['manipulable']),
  c('jordan-normal-form', ['manipulable']),
  c('linear-transformations'),
  c('linear-independence'),
];

describe('normaliseTopic', () => {
  it('treats the display label and the graph key as the same topic', () => {
    expect(normaliseTopic('Linear Algebra')).toBe('linear-algebra');
    expect(normaliseTopic('linear-algebra')).toBe('linear-algebra');
    expect(normaliseTopic('  Discrete  Mathematics ')).toBe('discrete--mathematics'.replace('--', '-'));
  });
});

describe('conceptKeywords', () => {
  it('drops fragments too short to identify anything', () => {
    expect(conceptKeywords('rank-nullity')).toEqual(['rank', 'nullity']);
    // A two-letter fragment would match almost any sentence.
    expect(conceptKeywords('lu-factorization')).toEqual(['factorization']);
  });
});

describe('questionNamesConcept', () => {
  it('matches on word boundaries, not substrings', () => {
    // "orthonormal" contains "normal". Substring matching resolved
    // "Apply Gram-Schmidt to obtain an orthonormal basis" to
    // `jordan-normal-form` — the wrong concept, labelled, next to the question.
    const distinctive = distinctiveKeywords(LA);
    expect(
      questionNamesConcept('obtain an orthonormal basis', 'jordan-normal-form', distinctive),
    ).toBe(false);
  });

  it('still matches inflected forms', () => {
    expect(questionNamesConcept('find the eigenvalue', 'eigenvalues')).toBe(true);
    expect(questionNamesConcept('compute the determinants', 'determinants')).toBe(true);
  });

  it('requires every keyword of a multi-word concept', () => {
    expect(questionNamesConcept('a linear equation', 'linear-transformations')).toBe(false);
    expect(questionNamesConcept('apply the linear transformation', 'linear-transformations')).toBe(true);
  });

  it('accepts a single keyword that is unique to one concept in the topic', () => {
    // Nothing else in linear algebra is the rank concept, so "What is the rank
    // of this matrix?" names rank-nullity as surely as if it said both words.
    const distinctive = distinctiveKeywords(LA);
    expect(distinctive.has('rank')).toBe(true);
    expect(questionNamesConcept('what is the rank of this matrix', 'rank-nullity', distinctive)).toBe(true);
  });

  it('does not accept a shared keyword as identifying', () => {
    const distinctive = distinctiveKeywords(LA);
    // 'linear' belongs to two concepts, so it identifies neither.
    expect(distinctive.has('linear')).toBe(false);
  });
});

describe('resolveConcept', () => {
  const ask = (questionText: string) =>
    resolveConcept({ topic: 'Linear Algebra', questionText, candidates: LA });

  it('opens the concept the question actually names', () => {
    expect(ask('Find the eigenvalues of A = [[4,1],[2,3]].').concept_id).toBe('eigenvalues');
    expect(ask('Compute the determinant of the 3x3 matrix.').concept_id).toBe('determinants');
    expect(ask('Apply Gram-Schmidt to obtain an orthonormal basis.').concept_id).toBe('gram-schmidt');
    expect(ask('What is the rank of this matrix?').concept_id).toBe('rank-nullity');
  });

  it('prefers the more specific concept over the one with more widgets', () => {
    // `trace` is fully named; `inner-product-spaces` only distinctively names
    // "product" and has a widget. Ranking widgets first labelled a trace
    // question with the wrong concept. A lesson that moves is a tiebreak,
    // never a reason to answer the wrong question.
    const r = ask('Find the trace of the product AB.');
    expect(r.concept_id).toBe('trace');
    expect(r.match).toBe('question-text');
  });

  it('falls back to a concept with interactives when the question names none', () => {
    const r = ask('A question with no concept words at all.');
    expect(r.match).toBe('topic-with-interactives');
    expect(r.interactive_kinds.length).toBeGreaterThan(0);
  });

  it('reports an unknown topic as unresolved with a working fallback', () => {
    // The dead end the original code refused to create is still refused.
    const r = resolveConcept({ topic: 'Astrophysics', questionText: 'anything', candidates: LA });
    expect(r.concept_id).toBeNull();
    expect(r.match).toBe('none');
    expect(r.fallback_route).toBe('/topic/Astrophysics');
  });

  it('still resolves a topic whose concepts have no widgets at all', () => {
    const r = resolveConcept({
      topic: 'linear-algebra',
      questionText: 'nothing named here',
      candidates: [c('trace'), c('rank-nullity')],
    });
    expect(r.match).toBe('topic-first');
    expect(r.concept_id).toBe('rank-nullity'); // stable, alphabetical
    expect(r.interactive_kinds).toEqual([]);
  });

  it('is deterministic — the same question always resolves the same way', () => {
    const a = ask('Is this matrix diagonalizable?');
    const b = ask('Is this matrix diagonalizable?');
    expect(a).toEqual(b);
  });

  it('always carries a fallback route, even on a hit', () => {
    expect(ask('Find the eigenvalues.').fallback_route).toBe('/topic/Linear%20Algebra');
  });
});
