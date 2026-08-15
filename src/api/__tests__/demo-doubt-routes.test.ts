import { describe, it, expect } from 'vitest';
import { looksLikeLinearAlgebra } from '../demo-doubt-routes';

/**
 * The scope check exists to SET EXPECTATIONS, never to refuse. An out-of-scope
 * problem is still captured and still answered later — telling a visitor their
 * question is unwelcome would be a worse outcome than answering it a day late.
 * These lock that it classifies sensibly without ever being a gate.
 */
describe('looksLikeLinearAlgebra', () => {
  it.each([
    'Find the eigenvalues of [[2,1],[1,2]]',
    'What is the determinant of a 3x3 matrix?',
    'Show that these vectors are orthogonal',
    'Prove the rank-nullity theorem',
    'Is this set a basis for the subspace?',
  ])('recognises %o as linear algebra', (q) => {
    expect(looksLikeLinearAlgebra(q)).toBe(true);
  });

  it.each([
    'Integrate x^2 sin(x) dx by parts',
    'What is the probability of two heads in three tosses?',
    'Solve dy/dx + 2y = 0',
  ])('classifies %o as outside the topic', (q) => {
    expect(looksLikeLinearAlgebra(q)).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(looksLikeLinearAlgebra('EIGENVALUES of A')).toBe(true);
  });

  it('does not crash on empty input', () => {
    expect(looksLikeLinearAlgebra('')).toBe(false);
  });
});
