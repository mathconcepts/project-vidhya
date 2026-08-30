/**
 * atomic-concept-map.ts — the verified crosswalk between docs/content-spec's
 * 116 `atomic_id`s (the founder's GATE Engineering Mathematics content-
 * generation specification) and this codebase's 101 `concept_id`s
 * (src/constants/concept-graph.ts).
 *
 * atomic-topic-spec.ts's own header comment used to say this mapping
 * "does NOT yet exist... fabricating it would silently steer generation
 * for the wrong concept." That was the right call with zero verification
 * behind it. This file IS that verification: every entry below was matched
 * by reading both sides' actual definitions — the atomic spec's
 * `atomic_subtopic` text against the concept graph's `label` +
 * `description` (src/constants/concept-graph.ts) — not by string-distance
 * guessing. Where two readings disagreed or nothing on the concept-graph
 * side actually covers the atomic topic, the id is left OUT of the map
 * (see `UNMAPPED_ATOMIC_IDS` below) rather than forced onto the closest
 * available concept.
 *
 * The two id spaces are NOT the same set, and this file is the record of
 * exactly where they diverge:
 *   - The concept graph is substantially RICHER for linear-algebra: the
 *     atomic spec's base scope covers 11 foundational LA topics (LA-01..11),
 *     while the concept graph's v4.34.0 "all 26 Linear Algebra concepts"
 *     pass added 15 more (vector-spaces, orthogonality, SVD, spectral
 *     theorem, Jordan form, quadratic forms, ...) that the atomic spec's
 *     base scope never described. Those 15 have no atomic_id counterpart —
 *     that's not a mapping gap to fix, it's real coverage this app built
 *     beyond the founder's base spec.
 *   - 16 atomic_ids (of 116) have no concept-graph counterpart at all,
 *     for one of two reasons, both recorded in `UNMAPPED_ATOMIC_IDS`:
 *     (a) the topic is real but nothing in the concept graph teaches it
 *     yet (e.g. DE-07 variable-coefficient ODEs, DM-11 matching), or
 *     (b) the topic is a cross-cutting skill/meta-topic rather than a
 *     single concept (e.g. VC-11 "theorem selection across Green/Stokes/
 *     Gauss" — that's the already-shipped theorem-selection guided
 *     walkthrough, not a concept in its own right; DE-08/DE-09
 *     initial/boundary-value "problems" are a problem TYPE that spans
 *     every ODE concept, not one of them).
 *   - Several concept_ids receive MORE THAN ONE atomic_id (expected,
 *     not an error): eigenvalues gets both LA-06 "Eigenvalues" and LA-07
 *     "Eigenvectors" (the app teaches them as one concept); pde-basics
 *     gets all 8 PD-* rows (the app has a single PDE concept where the
 *     atomic spec has 8 finer-grained ones).
 *
 * Consumers: never assume every atomic_id resolves — always check
 * `getConceptIdForAtomicId()`'s return for null. `mappingCoverage()` gives
 * the honest count for anything that wants to report on it (e.g. the
 * owner-page content-spec section).
 */

import { ALL_CONCEPTS } from '../constants/concept-graph';
import { loadAtomicTopicSpecs } from './atomic-topic-spec';

const VALID_CONCEPT_IDS = new Set(ALL_CONCEPTS.map((c) => c.id));

/**
 * atomic_id -> concept_id. Hand-verified (see file header). Grouped by
 * domain in the same order as docs/content-spec/atomic-content-generation-specs.csv.
 */
export const ATOMIC_TO_CONCEPT: Readonly<Record<string, string>> = Object.freeze({
  // Linear Algebra — LA-01..LA-11 all resolve; 15 more advanced LA
  // concepts (vector-spaces, svd, spectral-theorem, ...) have no atomic_id.
  'LA-01': 'matrix-operations',
  'LA-02': 'determinants',
  'LA-03': 'matrix-inverse',
  'LA-04': 'rank-nullity',
  'LA-05': 'systems-of-equations',
  'LA-06': 'eigenvalues',
  'LA-07': 'eigenvalues', // "Eigenvectors" — one concept covers both in this app
  'LA-08': 'symmetric-matrices',
  'LA-09': 'diagonalization',
  'LA-10': 'cayley-hamilton',
  'LA-11': 'lu-factorization',

  // Calculus — CA-14 (volume of revolution), CA-19 (2-var maxima/minima/
  // saddle points), CA-20 (Lagrange multipliers) have no concept: no
  // multivariable-optimization concept exists yet, and forcing them onto
  // the single-variable `maxima-minima` concept would misstate its scope.
  'CA-01': 'limits',
  'CA-02': 'limits', // indeterminate forms — in limits' own description
  'CA-03': 'limits', // L'Hopital's rule — in limits' own description
  'CA-04': 'continuity',
  'CA-05': 'differentiability',
  'CA-06': 'mean-value-theorems',
  'CA-07': 'maxima-minima',
  'CA-08': 'series', // Taylor theorem/remainder — "series" covers Taylor/Maclaurin
  'CA-09': 'series', // Taylor series — same concept
  'CA-10': 'definite-integrals', // FTC — definite-integrals' description leads with "FTC"
  'CA-11': 'definite-integrals',
  'CA-12': 'improper-integrals',
  'CA-13': 'definite-integrals', // area under curves — definite-integrals covers "area computation"
  'CA-15': 'multivariable-calculus', // limits/continuity of two variables
  'CA-16': 'multivariable-calculus', // partial derivatives
  'CA-17': 'multivariable-calculus', // total derivative
  'CA-18': 'multivariable-calculus', // directional derivative
  'CA-21': 'multiple-integrals',
  'CA-22': 'multiple-integrals',

  // Vector Calculus — VC-11 (theorem selection across Green/Stokes/Gauss)
  // has no concept: it's the cross-concept theorem-selection guided
  // walkthrough already shipped, not a concept in its own right.
  'VC-01': 'vector-fields',
  'VC-02': 'vector-fields', // gradient — in vector-fields' own description
  'VC-03': 'divergence-curl',
  'VC-04': 'divergence-curl',
  'VC-05': 'divergence-curl', // vector identities
  'VC-06': 'line-integrals',
  'VC-07': 'greens-theorem',
  'VC-08': 'surface-integrals',
  'VC-09': 'stokes-theorem',
  'VC-10': 'gauss-divergence',

  // Ordinary Differential Equations — DE-07 (variable-coefficient),
  // DE-08/DE-09 (IVP/BVP — problem types, not concepts), DE-10 (Wronskian),
  // DE-12 (Sturm-Liouville-style eigenvalue problems), DE-13 (power-series
  // solutions) have no concept yet.
  'DE-01': 'ode-first-order',
  'DE-02': 'ode-first-order', // separable/nonlinear — ode-first-order covers "separable"
  'DE-03': 'ode-exact',
  'DE-04': 'ode-first-order', // homogeneous first-order — reduces to a first-order technique
  'DE-05': 'ode-higher-order', // higher-order constant-coefficient
  'DE-06': 'ode-higher-order', // Cauchy-Euler — solved via operator methods, same concept
  'DE-11': 'ode-second-order-nonhomo', // variation of parameters — named explicitly in its description
  'DE-14': 'laplace-applications', // Laplace transforms in ODE solution — "Solving ODEs" in its description

  // Partial Differential Equations — the app teaches PDEs as one concept;
  // all 8 finer-grained atomic topics fold into it.
  'PD-01': 'pde-basics',
  'PD-02': 'pde-basics',
  'PD-03': 'pde-basics',
  'PD-04': 'pde-basics',
  'PD-05': 'pde-basics',
  'PD-06': 'pde-basics',
  'PD-07': 'pde-basics',
  'PD-08': 'pde-basics',

  // Complex Variables — full 1:1 domain coverage.
  'CX-01': 'complex-numbers',
  'CX-02': 'complex-numbers', // Argand plane
  'CX-03': 'complex-numbers', // polar/exponential form
  'CX-04': 'complex-numbers', // De Moivre's theorem — named explicitly in its description
  'CX-05': 'analytic-functions',
  'CX-06': 'analytic-functions', // Cauchy-Riemann equations — named explicitly
  'CX-07': 'complex-integration', // Cauchy's integral theorem
  'CX-08': 'complex-integration', // Cauchy's integral formula
  'CX-09': 'taylor-laurent',
  'CX-10': 'residue-calculus',

  // Probability and Statistics — PS-08 (median/mode) has no concept:
  // neither random-variables nor any other description covers descriptive
  // statistics like median/mode.
  'PS-01': 'probability-basics',
  'PS-02': 'counting-principles',
  'PS-03': 'probability-basics', // conditional probability — named explicitly
  'PS-04': 'probability-basics', // Bayes' theorem — named explicitly
  'PS-05': 'random-variables',
  'PS-06': 'random-variables', // mean/expectation — named explicitly
  'PS-07': 'random-variables', // variance — named explicitly
  'PS-09': 'discrete-distributions', // binomial — named explicitly
  'PS-10': 'discrete-distributions', // Poisson — named explicitly
  'PS-11': 'continuous-distributions', // normal — named explicitly
  'PS-12': 'sampling-distributions',
  'PS-13': 'regression-correlation', // correlation
  'PS-14': 'regression-correlation', // linear regression

  // Numerical Methods — NM-02 (conditioning/stability as a standalone
  // topic) has no concept: it's split across numerical-error-analysis,
  // numerical-linear-algebra and numerical-ode's own "stability analysis"
  // and forcing it onto any one would misstate the others' scope.
  'NM-01': 'numerical-error-analysis',
  'NM-03': 'numerical-linear-algebra', // Gauss elimination
  'NM-04': 'numerical-linear-algebra', // LU decomposition — named explicitly
  'NM-05': 'interpolation', // Lagrange interpolation — named explicitly
  'NM-06': 'interpolation', // Newton interpolation — "Newton divided differences" named
  'NM-07': 'root-finding', // Newton-Raphson — named explicitly
  'NM-08': 'numerical-integration', // trapezoidal rule — named explicitly
  'NM-09': 'numerical-integration', // Simpson's rule — named explicitly
  'NM-10': 'numerical-ode', // explicit Euler — named explicitly
  'NM-11': 'numerical-ode', // single/multistep methods — Runge-Kutta named explicitly

  // Discrete Mathematics for CS — DM-02 (first-order/predicate logic),
  // DM-07 (lattices), DM-08 (monoids), DM-11 (matching) have no concept:
  // propositional-logic is explicitly propositional (not predicate) logic,
  // group-theory-basics is explicitly groups (not the more general monoid),
  // and lattices/matching have no concept anywhere in the graph.
  'DM-01': 'propositional-logic',
  'DM-03': 'sets-relations',
  'DM-04': 'sets-relations', // relations — "equivalence/partial order relations" named
  'DM-05': 'functions-combinatorics',
  'DM-06': 'sets-relations', // partial orders — same "partial order relations" phrase
  'DM-09': 'group-theory-basics',
  'DM-10': 'graph-connectivity',
  'DM-12': 'graph-coloring',
  'DM-13': 'functions-combinatorics', // counting — "counting" named explicitly
  'DM-14': 'recurrence-relations',
  'DM-15': 'recurrence-relations', // generating functions — named explicitly
});

/**
 * atomic_ids deliberately left unmapped, with the reason — never silently
 * absent. Every id here is real (exists in docs/content-spec/) and every
 * reason names either the missing concept-graph coverage or the
 * cross-cutting nature of the topic. Checked for completeness against
 * loadAtomicTopicSpecs() by this module's own test.
 */
export const UNMAPPED_ATOMIC_IDS: Readonly<Record<string, string>> = Object.freeze({
  'CA-14': 'Volume of revolution — no concept covers this technique; multiple-integrals is double/triple integrals, not disk/shell single-integral volumes.',
  'CA-19': 'Maxima/minima/saddle points of two variables — maxima-minima is single-variable (critical points, second derivative test); no multivariable-optimization concept exists.',
  'CA-20': 'Lagrange multipliers — no concept covers constrained optimization.',
  'VC-11': 'Theorem selection across Green/Stokes/Gauss — a cross-concept synthesis skill (the already-shipped theorem-selection guided walkthrough), not a single concept.',
  'DE-07': 'Variable-coefficient linear equations — no concept covers this; ode-second-order-nonhomo is specifically about particular-solution methods for constant-coefficient equations.',
  'DE-08': 'Initial-value problems — a problem TYPE spanning every ODE concept, not one of them.',
  'DE-09': 'Boundary-value problems — same reasoning as DE-08.',
  'DE-10': 'Wronskian — a tool used within second-order theory, but not named in any concept description; forcing it onto ode-second-order-homo would overstate that concept’s stated scope.',
  'DE-12': 'Eigenvalue problems for second-order equations (Sturm-Liouville-style) — closest is pde-basics (separation of variables produces these), but it is not the same topic and pde-basics does not mention it.',
  'DE-13': 'Power-series solutions at ordinary points — no concept covers ODE series-solution methods (the graph’s "series" concept is Taylor/Maclaurin for calculus, not ODE solving).',
  'PS-08': 'Median and mode — no concept description mentions descriptive statistics beyond mean/variance.',
  'NM-02': 'Conditioning and stability concepts as a standalone topic — split across numerical-error-analysis, numerical-linear-algebra’s condition number, and numerical-ode’s own stability analysis; no single concept owns it.',
  'DM-02': 'First-order (predicate) logic — propositional-logic is explicitly propositional (connectives, truth tables), not predicate logic with quantifiers.',
  'DM-07': 'Lattices — no concept covers this algebraic structure.',
  'DM-08': 'Monoids — group-theory-basics is explicitly about groups, a stricter structure than monoids; not the same topic.',
  'DM-11': 'Matching (graph theory) — no concept covers graph matching.',
});

/** Look up the concept_id for an atomic_id. Null if deliberately unmapped or unknown. */
export function getConceptIdForAtomicId(atomicId: string): string | null {
  return ATOMIC_TO_CONCEPT[atomicId] ?? null;
}

/** Every atomic_id that maps to a given concept_id (zero, one, or many). */
export function getAtomicIdsForConceptId(conceptId: string): string[] {
  return Object.entries(ATOMIC_TO_CONCEPT)
    .filter(([, cid]) => cid === conceptId)
    .map(([atomicId]) => atomicId);
}

export interface MappingCoverage {
  total_atomic_ids: number;
  mapped: number;
  unmapped: number;
  unmapped_reasons: Record<string, string>;
  /** concept_ids that receive 2+ atomic_ids (expected — see file header). */
  concepts_with_multiple_atomic_ids: Record<string, string[]>;
  /** Real concept-graph concepts with no atomic_id at all (richer app coverage). */
  concepts_without_atomic_id: string[];
}

/**
 * Honest coverage report — computed live from the real committed
 * docs/content-spec/ CSVs and concept-graph.ts, never a stored/stale
 * count. Used by the admin content-spec API and the owner page.
 */
export function mappingCoverage(): MappingCoverage {
  const allAtomicIds = [...loadAtomicTopicSpecs().keys()];
  const mappedIds = Object.keys(ATOMIC_TO_CONCEPT);
  const mappedConceptCounts = new Map<string, string[]>();
  for (const [atomicId, conceptId] of Object.entries(ATOMIC_TO_CONCEPT)) {
    const list = mappedConceptCounts.get(conceptId) ?? [];
    list.push(atomicId);
    mappedConceptCounts.set(conceptId, list);
  }
  const mappedConceptIds = new Set(mappedConceptCounts.keys());
  return {
    total_atomic_ids: allAtomicIds.length,
    mapped: mappedIds.length,
    unmapped: allAtomicIds.length - mappedIds.length,
    unmapped_reasons: { ...UNMAPPED_ATOMIC_IDS },
    concepts_with_multiple_atomic_ids: Object.fromEntries(
      [...mappedConceptCounts.entries()].filter(([, ids]) => ids.length > 1),
    ),
    concepts_without_atomic_id: ALL_CONCEPTS.map((c) => c.id).filter((id) => !mappedConceptIds.has(id)),
  };
}

// Fail loudly at import time if the map ever drifts from reality — a typo
// in either id space here would silently misroute content generation,
// exactly the failure mode this file exists to prevent.
for (const [atomicId, conceptId] of Object.entries(ATOMIC_TO_CONCEPT)) {
  if (!VALID_CONCEPT_IDS.has(conceptId)) {
    throw new Error(`atomic-concept-map: "${atomicId}" maps to unknown concept_id "${conceptId}"`);
  }
}
