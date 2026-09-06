/**
 * eigen-2x2.ts
 *
 * /investigate (2026-09-06) follow-up to the practice-explanation-motion +
 * engagement-gate pass: "how did they arrive at those coordinates... this
 * needs to be dynamically adapted for any problems. create additional
 * solvers if needed." The prior fix hand-wrote a `why` sentence for exactly
 * two concepts (eigenvalues, quadratic-forms) — real content, but it does
 * not generalize: every OTHER `linear_map` scene in the corpus (20 concepts
 * as of this writing — diagonalization, svd, spectral-theorem,
 * symmetric-matrices, positive-definite-matrices, and more) still shows two
 * highlighted arrows with no derivation at all.
 *
 * This file is the actual solver: given a raw 2x2 matrix, it independently
 * derives the eigenvalues (closed-form quadratic on the trace/determinant —
 * no numerical iteration needed at this size) and a matching eigenvector,
 * with no dependence on any authored/hand-verified data. `deriveLinearMapWhy`
 * then formats a scene's ALREADY-authored, ALREADY-verified `eigen[]` array
 * (checkLinearMap's residual check in types.ts already guarantees
 * matrix·dir ≈ value·dir for every committed scene) into the same
 * "here's the two-step method" sentence for ANY matrix, not just the two
 * that got hand-authored text — this is what makes the fix dynamic rather
 * than a second hardcoded pair of concepts.
 *
 * `solveEigen2x2` itself is kept genuinely independent (it does not read
 * `eigen[]` at all) so it stays useful beyond formatting: it's the thing a
 * future content-generation or CI pass would call to auto-derive eigenpairs
 * for a matrix that has none yet, and its own test suite is the correctness
 * evidence for every real matrix already committed in this repo.
 */

import type { LinearMapSceneSpec, Mat2 } from './types';
import { MAX_WHY_CHARS } from './types';

const EPSILON = 1e-9;

export interface Eigen2x2Pair {
  value: number;
  /** A genuine eigenvector for `value` — NOT necessarily matching the sign
   *  or scale of any authored `eigen[].dir`. Eigenvectors are only defined
   *  up to a nonzero scalar, so two independently-derived vectors for the
   *  same eigenvalue can disagree by sign/scale and both be correct. */
  dir: [number, number];
}

export interface Eigen2x2Solution {
  trace: number;
  det: number;
  discriminant: number;
  /** True when the matrix has one repeated real eigenvalue (a Jordan block
   *  or a scaled identity) — `pairs` then has length 1, not 2. */
  repeated: boolean;
  pairs: Eigen2x2Pair[];
}

/**
 * Closed-form 2x2 eigen-decomposition. Returns `null` only for genuinely
 * complex eigenvalues (discriminant < 0) — out of scope for every GATE-EM
 * `linear_map` scene, which exists specifically to show a real stretch/
 * rotation-free direction.
 */
export function solveEigen2x2(matrix: Mat2): Eigen2x2Solution | null {
  const [[a, b], [c, d]] = matrix;
  const trace = a + d;
  const det = a * d - b * c;
  const discriminant = trace * trace - 4 * det;
  if (discriminant < -EPSILON) return null;

  const sqrtDisc = Math.sqrt(Math.max(0, discriminant));
  const repeated = sqrtDisc < EPSILON;
  const values = repeated ? [trace / 2] : [(trace + sqrtDisc) / 2, (trace - sqrtDisc) / 2];

  const pairs = values.map((value) => ({ value, dir: eigenvectorFor(matrix, value) }));
  return { trace, det, discriminant, repeated, pairs };
}

/** Standard 2x2 eigenvector shortcut: pick whichever row of (A − λI) is
 *  nonzero and read the null-space vector off it directly. Falls back to a
 *  standard-basis vector only for an already-diagonal matrix. */
function eigenvectorFor(matrix: Mat2, lambda: number): [number, number] {
  const [[a, b], [c, d]] = matrix;
  if (Math.abs(c) > EPSILON) return [lambda - d, c];
  if (Math.abs(b) > EPSILON) return [b, lambda - a];
  return Math.abs(a - lambda) < EPSILON ? [1, 0] : [0, 1];
}

function isNearInt(n: number): boolean {
  return Math.abs(n - Math.round(n)) < 1e-6;
}

function fmtScalar(n: number): string {
  const r = Math.round(n);
  return Math.abs(n - r) < 1e-6 ? String(r) : (Math.round(n * 100) / 100).toString();
}

/**
 * Only worth naming a specific eigenvector in prose when it (or a clean
 * rescaling of it) is a small integer pair — an irrational/normalized
 * direction (e.g. a unit eigenvector) reads badly as "(0.71, 0.71)" and is
 * better described by method alone. Deliberately preserves the AUTHORED
 * sign/scale whenever it is already clean — dividing an authored (4, 2)
 * down to (2, 1) is a harmless simplification, but flipping (−1, 2) to
 * (1, −2) would describe a DIFFERENT-looking arrow than the one drawn,
 * even though both are valid eigenvectors of the same line.
 */
function cleanVectorLabel(v: [number, number]): string | null {
  let [x, y] = v;
  if (isNearInt(x) && isNearInt(y)) {
    x = Math.round(x);
    y = Math.round(y);
  } else {
    const minAbs = Math.min(Math.abs(x), Math.abs(y));
    if (minAbs <= EPSILON) return null;
    const sx = x / minAbs;
    const sy = y / minAbs;
    if (!isNearInt(sx) || !isNearInt(sy)) return null;
    x = Math.round(sx);
    y = Math.round(sy);
  }
  if (Math.abs(x) > 20 || Math.abs(y) > 20) return null;
  return `(${x}, ${y})`;
}

/**
 * The dynamic replacement for a hand-authored `SimulationSpec.why` /
 * `ManipulableSpec.why` on a `linear_map` scene: formats the scene's own
 * (already parser-verified) matrix + eigen data into a "here's the
 * derivation" sentence, for whatever matrix this particular concept
 * happens to use. Returns `null` when there is nothing to explain (no
 * `eigen` highlighted — e.g. a determinant/area scene with no eigen-arrow
 * payoff) or when the matrix's own eigenvalues turn out to be complex
 * (should never happen for a scene that already declares real `eigen[]`,
 * but this stays defensive rather than emitting a nonsensical sentence).
 */
export function deriveLinearMapWhy(linearMap: LinearMapSceneSpec | undefined): string | null {
  if (!linearMap?.eigen?.length) return null;
  const solved = solveEigen2x2(linearMap.matrix);
  if (!solved) return null;

  if (linearMap.eigen.length === 1) {
    const lambda = fmtScalar(linearMap.eigen[0].value);
    const vecLabel = cleanVectorLabel(linearMap.eigen[0].dir);
    const withVec = vecLabel
      ? `${vecLabel} isn't guessed: det(A − λI) = 0 gives a repeated λ = ${lambda} here, and (A − λI)v = 0 still gives this one eigenvector — the same two-step method, just one direction to find.`
      : null;
    const generic = `This eigenvector isn't guessed: det(A − λI) = 0 gives a repeated λ = ${lambda} here, and solving (A − λI)v = 0 gives it — the same two-step method, just one direction to find.`;
    return pickWithinBudget(withVec, generic);
  }

  const [pairA, pairB] = linearMap.eigen;
  const lambdaA = fmtScalar(pairA.value);
  const lambdaB = fmtScalar(pairB.value);
  const vecA = cleanVectorLabel(pairA.dir);
  const vecB = cleanVectorLabel(pairB.dir);
  const withVec =
    vecA && vecB
      ? `${vecA} and ${vecB} aren't guessed: each solves (A − λI)v = 0 for its own eigenvalue (${lambdaA} and ${lambdaB}) from det(A − λI) = 0 — the same two-step method finds every eigenvector you'll ever need.`
      : null;
  const generic = `These aren't guessed: solving det(A − λI) = 0 gives λ = ${lambdaA} and λ = ${lambdaB}; each eigenvector then solves (A − λI)v = 0 for its own λ — the same two-step method finds every eigenvector you'll ever need.`;
  return pickWithinBudget(withVec, generic);
}

function pickWithinBudget(withVec: string | null, generic: string): string {
  if (withVec && withVec.length <= MAX_WHY_CHARS) return withVec;
  return generic;
}
