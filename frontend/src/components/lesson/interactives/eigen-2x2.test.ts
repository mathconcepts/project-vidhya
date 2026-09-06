/**
 * eigen-2x2.test.ts — the solver behind the dynamic `why` fallback
 * (/investigate, 2026-09-06: "how did they arrive at those coordinates...
 * dynamically adapted for any problems"). Verified against every real
 * `linear_map.matrix` committed in the corpus as of this writing, so this
 * suite doubles as proof the formula agrees with the content, not just with
 * itself.
 */
import { describe, it, expect } from 'vitest';
import { solveEigen2x2, deriveLinearMapWhy } from './eigen-2x2';
import type { Mat2, LinearMapSceneSpec } from './types';
import { MAX_WHY_CHARS } from './types';

// Every `linear_map.matrix` in the corpus with a real (non-rotation) action,
// as of the 2026-09-06 audit — pulled directly from the committed hook.md /
// intuition.md fenced blocks, not invented.
const CORPUS_MATRICES: Record<string, Mat2> = {
  determinants: [[2, 1], [0, 1.5]],
  diagonalization: [[4, 1], [2, 3]],
  eigenvalues: [[2, 1], [1, 2]],
  'least-squares': [[0.8, 0.4], [0.4, 0.2]],
  'linear-independence': [[1, 1], [0, 2]],
  'linear-transformations': [[1, 1], [0, 1]],
  'matrix-inverse': [[3, 1], [1, 1]],
  'matrix-operations': [[2, 1], [1, 1]],
  'null-space-column-space': [[1, -1], [-1, 1]],
  'positive-definite-matrices': [[3, 1], [1, 2]],
  'quadratic-forms': [[5, 2], [2, 2]],
  'rank-nullity': [[1, 2], [0.5, 1]],
  'spectral-theorem': [[2, 2], [2, -1]],
  svd: [[2, 1], [0, 1]],
  'symmetric-matrices': [[3, 1], [1, 3]],
};

// orthogonality's hook is a rotation matrix — genuinely complex eigenvalues,
// which is exactly why its content has no `eigen` block at all.
const ROTATION_MATRIX: Mat2 = [[0.76604444, -0.64278761], [0.64278761, 0.76604444]];

function isEigenpair(matrix: Mat2, value: number, dir: [number, number], tol = 1e-6) {
  const [[a, b], [c, d]] = matrix;
  const mx = a * dir[0] + b * dir[1];
  const my = c * dir[0] + d * dir[1];
  const residual = Math.hypot(mx - value * dir[0], my - value * dir[1]);
  return residual <= tol * Math.max(1, Math.abs(value)) * Math.hypot(dir[0], dir[1]);
}

describe('solveEigen2x2 — every real corpus matrix', () => {
  Object.entries(CORPUS_MATRICES).forEach(([concept, matrix]) => {
    it(`derives genuine eigenpairs for ${concept}'s hook matrix`, () => {
      const solved = solveEigen2x2(matrix);
      expect(solved).not.toBeNull();
      if (!solved) return;
      // trace/det sanity check — the two invariants every eigenvalue pair must satisfy.
      const sumOfValues = solved.pairs.reduce((s, p) => s + p.value, 0) * (solved.repeated ? 2 : 1);
      const productOfValues = solved.pairs.length === 2 ? solved.pairs[0].value * solved.pairs[1].value : solved.pairs[0].value ** 2;
      expect(sumOfValues).toBeCloseTo(solved.trace, 5);
      expect(productOfValues).toBeCloseTo(solved.det, 5);
      // every returned (value, dir) pair must be a genuine eigenpair of the matrix.
      solved.pairs.forEach((pair) => {
        expect(isEigenpair(matrix, pair.value, pair.dir)).toBe(true);
      });
    });
  });

  it('returns null for a genuinely complex-eigenvalue matrix (rotation)', () => {
    expect(solveEigen2x2(ROTATION_MATRIX)).toBeNull();
  });

  it('detects a repeated eigenvalue (linear-transformations: a shear) and returns exactly one pair', () => {
    const solved = solveEigen2x2(CORPUS_MATRICES['linear-transformations']);
    expect(solved?.repeated).toBe(true);
    expect(solved?.pairs.length).toBe(1);
    expect(solved?.pairs[0].value).toBeCloseTo(1, 6);
  });

  it('every other matrix in the corpus sample has two distinct real eigenvalues', () => {
    Object.entries(CORPUS_MATRICES)
      .filter(([concept]) => concept !== 'linear-transformations')
      .forEach(([, matrix]) => {
        const solved = solveEigen2x2(matrix);
        expect(solved?.repeated).toBe(false);
        expect(solved?.pairs.length).toBe(2);
      });
  });
});

function spec(matrix: Mat2, eigen?: Array<{ dir: [number, number]; value: number }>): LinearMapSceneSpec {
  return { matrix, eigen };
}

describe('deriveLinearMapWhy — dynamic fallback for any linear_map scene', () => {
  it('returns null when there is no linear_map at all', () => {
    expect(deriveLinearMapWhy(undefined)).toBeNull();
  });

  it('returns null when the scene has a matrix but no eigen array (nothing to explain)', () => {
    // determinants' real hook: area-scaling scene, no eigen-arrow payoff.
    expect(deriveLinearMapWhy(spec(CORPUS_MATRICES.determinants))).toBeNull();
  });

  it('names the actual coordinates when they are clean integers (quadratic-forms real content)', () => {
    const why = deriveLinearMapWhy(
      spec(CORPUS_MATRICES['quadratic-forms'], [
        { dir: [2, 1], value: 6 },
        { dir: [-1, 2], value: 1 },
      ]),
    );
    expect(why).not.toBeNull();
    expect(why).toContain('(2, 1)');
    expect(why).toContain('(-1, 2)');
    expect(why).toContain('6');
    expect(why).toContain('det(A − λI) = 0');
    expect(why).toContain('(A − λI)v = 0');
    expect(why!.length).toBeLessThanOrEqual(MAX_WHY_CHARS);
  });

  it('falls back to method-only phrasing for an irrational/normalized eigenvector (positive-definite-matrices real content)', () => {
    const why = deriveLinearMapWhy(
      spec(CORPUS_MATRICES['positive-definite-matrices'], [
        { dir: [1, 0.61803399], value: 3.61803399 },
        { dir: [1, -1.61803399], value: 1.38196601 },
      ]),
    );
    expect(why).not.toBeNull();
    // no decimal-heavy vector should ever leak into the sentence
    expect(why).not.toMatch(/\(-?\d+\.\d+/);
    expect(why).toContain('λ = 3.62');
    expect(why).toContain('λ = 1.38');
    expect(why!.length).toBeLessThanOrEqual(MAX_WHY_CHARS);
  });

  it('uses repeated-eigenvalue phrasing for a shear (linear-transformations real content)', () => {
    const why = deriveLinearMapWhy(spec(CORPUS_MATRICES['linear-transformations'], [{ dir: [1, 0], value: 1 }]));
    expect(why).not.toBeNull();
    expect(why).toMatch(/repeated/);
    expect(why).toContain('(1, 0)');
    expect(why).toContain('one direction to find');
  });

  it('stays within MAX_WHY_CHARS for every real matrix + its authored eigen array', () => {
    const authoredEigen: Record<string, Array<{ dir: [number, number]; value: number }>> = {
      diagonalization: [{ dir: [1, 1], value: 5 }, { dir: [1, -2], value: 2 }],
      eigenvalues: [{ dir: [0.70710678, 0.70710678], value: 3 }, { dir: [0.70710678, -0.70710678], value: 1 }],
      'least-squares': [{ dir: [2, 1], value: 1 }, { dir: [1, -2], value: 0 }],
      'linear-independence': [{ dir: [1, 0], value: 1 }, { dir: [1, 1], value: 2 }],
      'linear-transformations': [{ dir: [1, 0], value: 1 }],
      'null-space-column-space': [{ dir: [1, -1], value: 2 }, { dir: [1, 1], value: 0 }],
      'positive-definite-matrices': [{ dir: [1, 0.61803399], value: 3.61803399 }, { dir: [1, -1.61803399], value: 1.38196601 }],
      'quadratic-forms': [{ dir: [2, 1], value: 6 }, { dir: [-1, 2], value: 1 }],
      'rank-nullity': [{ dir: [1, 0.5], value: 2 }, { dir: [2, -1], value: 0 }],
      'spectral-theorem': [{ dir: [2, 1], value: 3 }, { dir: [1, -2], value: -2 }],
      svd: [{ dir: [1, 0], value: 2 }, { dir: [1, -1], value: 1 }],
      'symmetric-matrices': [{ dir: [1, 1], value: 4 }, { dir: [1, -1], value: 2 }],
    };
    Object.entries(authoredEigen).forEach(([concept, eigen]) => {
      const why = deriveLinearMapWhy(spec(CORPUS_MATRICES[concept], eigen));
      expect(why, `${concept} produced no why`).not.toBeNull();
      expect(why!.length, `${concept}'s why exceeded MAX_WHY_CHARS`).toBeLessThanOrEqual(MAX_WHY_CHARS);
    });
  });
});
