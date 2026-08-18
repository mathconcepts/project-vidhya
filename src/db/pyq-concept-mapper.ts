/**
 * PYQ → concept_id mapper (T3 / Milestone A / A2).
 *
 * `pyq_questions` has no concept-level classification — only a coarse
 * `topic` TEXT column. `session-store.ts`'s `fetchProblemsForConcept`
 * queries `WHERE concept_id = $1`, and until this mapper ran, that column
 * didn't exist and every real PYQ was invisible to it.
 *
 * Deterministic, explicit, NEVER a guess: every rule below was written by
 * reading the actual question in `data/courses/gate-em/topics/<topic>/mcqs.json`
 * (or, for migration 035's untagged rows, the raw SQL text) and confirming
 * the mapped concept id is the one the question is actually testing — not
 * inferred from tag-name string similarity alone. A question no rule
 * confidently matches returns `null`; callers must NEVER fall back to a
 * best-guess concept id.
 *
 * Two matching strategies, tried in order:
 *   1. Tag-based (`mapPyqTagsToConceptId`) — the static mcqs.json files
 *      carry an author-curated `tags` array per question, ordered
 *      (verified against every question in the 10 topic files) with the
 *      PRIMARY tested concept listed first. We walk the tags in order and
 *      return the concept for the first tag this topic's map recognizes —
 *      which is why the map only needs ONE entry per tag, not per
 *      question, and still resolves each question to its actual primary
 *      concept rather than a secondary one that happens to appear first
 *      alphabetically.
 *   2. Text-keyword-based (`mapPyqTextToConceptId`) — for rows with no
 *      tags at all (migration 035's 11 hand-inserted linear-algebra rows).
 *      Each rule is a literal substring lifted from that exact question,
 *      not a generic keyword.
 *
 * Deliberately conservative: many tags below are OMITTED even though a
 * plausible-sounding concept exists, because the tag is ambiguous across
 * more than one concept in that topic (e.g. bare "calculus", "statistics",
 * "differential-calculus" — all seen prefixed onto questions covering
 * several different concepts) or was never observed as the FIRST (i.e.
 * primary) tag on any question, so including it could never be verified
 * against real content. Those stay unmapped and the seeder counts them.
 */

/**
 * Per-topic tag → concept_id tables. Keyed by the topic value as it
 * appears in `data/courses/gate-em/topics/*​/mcqs.json`'s `topic` field
 * EXCEPT for the two topics `seed-static-pyqs.ts` renames via
 * `TOPIC_DIR_ALIAS` before the row is ever written to `pyq_questions`
 * ('transform-theory' → 'transforms', 'discrete-mathematics' →
 * 'discrete') — those two keys below use the CANONICAL (post-alias) name,
 * matching what actually lands in the `topic` column so the DB-side
 * backfill UPDATE can key off it directly.
 */
const TAG_MAPS: Record<string, Record<string, string>> = {
  'linear-algebra': {
    'eigenvalues': 'eigenvalues',
    'characteristic-equation': 'eigenvalues',
    'complex-eigenvalues': 'eigenvalues',
    'rotation-matrix': 'eigenvalues',
    'system-of-equations': 'systems-of-equations',
    'consistency': 'systems-of-equations',
    'overdetermined-system': 'systems-of-equations',
    'rank-nullity': 'rank-nullity',
    'null-space': 'rank-nullity',
    'rank': 'rank-nullity',
    'determinant': 'determinants',
    'singular-matrix': 'determinants',
    'linear-dependence': 'linear-independence',
    'linear-independence': 'linear-independence',
    'matrices': 'matrix-operations',
    'basis': 'vector-spaces',
    'vector-spaces': 'vector-spaces',
    'invertible-matrix': 'matrix-inverse',
    'matrix-inverse': 'matrix-inverse',
    'inverse': 'matrix-inverse',
    'trace': 'trace',
    'matrix-powers': 'trace',
    'orthogonal-matrix': 'orthogonality',
    'column-space': 'null-space-column-space',
    'quadratic-forms': 'quadratic-forms',
    'symmetric-matrix': 'symmetric-matrices',
    'spectral-theorem': 'spectral-theorem',
  },

  'calculus': {
    'limits': 'limits',
    'standard-limits': 'limits',
    'lhopital': 'limits',
    'continuity': 'continuity',
    'differentiability': 'differentiability',
    'derivatives': 'derivatives-basic',
    'critical-points': 'maxima-minima',
    'maxima-minima': 'maxima-minima',
    'mean-value-theorem': 'mean-value-theorems',
    'integration-by-parts': 'integration-by-parts',
    'substitution': 'integration-substitution',
    'definite-integral': 'definite-integrals',
    'area-between-curves': 'definite-integrals',
    'trigonometric-integrals': 'definite-integrals',
    'improper-integrals': 'improper-integrals',
    'multivariable': 'multivariable-calculus',
    'partial-derivatives': 'multivariable-calculus',
    'mixed-partials': 'multivariable-calculus',
    'total-derivative': 'multivariable-calculus',
    'double-integral': 'multiple-integrals',
    'iterated-integral': 'multiple-integrals',
    'taylor-series': 'series',
    'maclaurin': 'series',
  },

  'differential-equations': {
    'first-order-ode': 'ode-first-order',
    'separable-ode': 'ode-first-order',
    'integrating-factor': 'ode-first-order',
    'linear-ode': 'ode-first-order',
    // Verified against de-013's actual question (dy/dx = (x+y)/(x-y)) — this
    // tag denotes a first-order homogeneous ODE (dy/dx = F(y/x) form), NOT
    // the second-order "homogeneous" (RHS=0) sense the name suggests.
    'homogeneous-ode': 'ode-first-order',
    'bernoulli-equation': 'ode-bernoulli',
    'exact-ode': 'ode-exact',
    'second-order-ode': 'ode-second-order-homo',
    'characteristic-equation': 'ode-second-order-homo',
    'repeated-roots': 'ode-second-order-homo',
    'complex-roots': 'ode-second-order-homo',
    'oscillatory-solution': 'ode-second-order-homo',
    // Verified against de-014 (RHS=0, free/undamped-forcing oscillation).
    'damped-oscillation': 'ode-second-order-homo',
    'non-homogeneous-ode': 'ode-second-order-nonhomo',
    'resonance': 'ode-second-order-nonhomo',
    'undetermined-coefficients': 'ode-second-order-nonhomo',
    'operator-method': 'ode-second-order-nonhomo',
    'particular-integral': 'ode-second-order-nonhomo',
    'pde': 'pde-basics',
    'wave-equation': 'pde-basics',
    'hyperbolic': 'pde-basics',
    'parabolic': 'pde-basics',
    'potential-function': 'pde-basics',
  },

  'complex-variables': {
    'cauchy-riemann': 'analytic-functions',
    'analyticity': 'analytic-functions',
    'harmonic-conjugate': 'analytic-functions',
    'analytic-function': 'analytic-functions',
    'analytic-functions': 'analytic-functions',
    'harmonic-functions': 'analytic-functions',
    'entire-functions': 'analytic-functions',
    'contour-integral': 'complex-integration',
    'cauchy-theorem': 'complex-integration',
    'cauchy-integral-formula': 'complex-integration',
    'residue': 'residue-calculus',
    'pole-of-order-m': 'residue-calculus',
    'singularity': 'residue-calculus',
    'pole-order': 'residue-calculus',
    'residue-theorem': 'residue-calculus',
    'poles': 'residue-calculus',
    'complex-algebra': 'complex-numbers',
    'modulus-argument': 'complex-numbers',
    'polar-form': 'complex-numbers',
    'de-moivre': 'complex-numbers',
    'fundamental-theorem': 'complex-numbers',
    'zeros-of-polynomial': 'complex-numbers',
    'power-series': 'taylor-laurent',
    'radius-of-convergence': 'taylor-laurent',
    'taylor-series': 'taylor-laurent',
    'laurent-series': 'taylor-laurent',
  },

  'probability-statistics': {
    'basic-probability': 'probability-basics',
    'bayes-theorem': 'probability-basics',
    'conditional-probability': 'probability-basics',
    'addition-rule': 'probability-basics',
    'mutually-exclusive': 'probability-basics',
    'without-replacement': 'probability-basics',
    'counting': 'counting-principles',
    'poisson-distribution': 'discrete-distributions',
    'binomial-distribution': 'discrete-distributions',
    'exponential-distribution': 'continuous-distributions',
    'normal-distribution': 'continuous-distributions',
    'continuous-distribution': 'continuous-distributions',
    'variance': 'random-variables',
    'expectation': 'random-variables',
    'mean-variance': 'random-variables',
    'mgf': 'random-variables',
    'random-variables': 'random-variables',
    'joint-distribution': 'joint-distributions',
    'marginal-pdf': 'joint-distributions',
    'correlation': 'regression-correlation',
    'covariance': 'regression-correlation',
    'sample-mean': 'hypothesis-testing',
  },

  'numerical-methods': {
    'newton-raphson': 'root-finding',
    'bisection': 'root-finding',
    'root-finding': 'root-finding',
    'interpolation': 'interpolation',
    'lagrange': 'interpolation',
    'finite-differences': 'interpolation',
    'integration': 'numerical-integration',
    'simpson': 'numerical-integration',
    'trapezoidal': 'numerical-integration',
    'euler-method': 'numerical-ode',
    'runge-kutta': 'numerical-ode',
    'ode': 'numerical-ode',
    'gauss-seidel': 'numerical-linear-algebra',
    'jacobi': 'numerical-linear-algebra',
    'linear-systems': 'numerical-linear-algebra',
  },

  // Canonical (post-TOPIC_DIR_ALIAS) topic id — see header comment.
  'transforms': {
    'laplace': 'laplace-transform',
    'shifting-theorem': 'laplace-transform',
    'second-shift': 'laplace-transform',
    'standard-transforms': 'laplace-transform',
    'impulse': 'laplace-transform',
    'convolution': 'laplace-transform',
    'initial-value-theorem': 'laplace-transform',
    'inverse-laplace': 'inverse-laplace',
    'z-transform': 'z-transform',
    'unit-step': 'z-transform',
    'fourier-series': 'fourier-series',
    'fourier-transform': 'fourier-transform',
    'rectangular-pulse': 'fourier-transform',
    'sinc': 'fourier-transform',
    'time-shift': 'fourier-transform',
    'parseval': 'fourier-transform',
    'energy': 'fourier-transform',
  },

  // Canonical (post-TOPIC_DIR_ALIAS) topic id — see header comment.
  'discrete': {
    'logic': 'propositional-logic',
    'tautology': 'propositional-logic',
    'implication': 'propositional-logic',
    'contrapositive': 'propositional-logic',
    'set-theory': 'sets-relations',
    'relations': 'sets-relations',
    'power-set': 'sets-relations',
    'partial-order': 'sets-relations',
    'equivalence': 'sets-relations',
    'functions': 'functions-combinatorics',
    'bijective': 'functions-combinatorics',
    'combinatorics': 'functions-combinatorics',
    'combinations': 'functions-combinatorics',
    'permutations': 'functions-combinatorics',
    'pigeonhole': 'functions-combinatorics',
    'boolean-algebra': 'boolean-algebra',
    'simplification': 'boolean-algebra',
  },

  'graph-theory': {
    'complete-graph': 'graph-basics',
    'degree-sequence': 'graph-basics',
    'degree': 'graph-basics',
    'edges': 'graph-basics',
    'bipartite': 'graph-basics',
    'complete-bipartite': 'graph-basics',
    'tree': 'trees',
    'spanning-tree': 'trees',
    'planar': 'planar-graphs',
    'kuratowski': 'planar-graphs',
    'euler-formula': 'planar-graphs',
    'faces': 'planar-graphs',
    'eulerian': 'euler-hamilton',
    'euler-path': 'euler-hamilton',
    'hamiltonian': 'euler-hamilton',
    'dirac-theorem': 'euler-hamilton',
    'chromatic-number': 'graph-coloring',
    'graph-coloring': 'graph-coloring',
  },

  'vector-calculus': {
    'divergence': 'divergence-curl',
    'curl': 'divergence-curl',
    'solenoidal': 'divergence-curl',
    'irrotational': 'divergence-curl',
    'laplacian': 'divergence-curl',
    'conservative': 'vector-fields',
    'gradient': 'vector-fields',
    'directional-derivative': 'vector-fields',
    'vector-field': 'vector-fields',
    'green-theorem': 'greens-theorem',
    'gauss-theorem': 'gauss-divergence',
    'divergence-theorem': 'gauss-divergence',
    'line-integral': 'line-integrals',
    'stokes-theorem': 'stokes-theorem',
    'surface-integral': 'surface-integrals',
    'flux': 'surface-integrals',
  },
};

/**
 * Walk `tags` in order and return the concept for the FIRST tag this
 * topic's map recognizes. Tag order in the source files consistently
 * lists the primary tested concept first (verified against all 150
 * questions while building TAG_MAPS above), so first-match is correct,
 * not arbitrary — e.g. a question tagged
 * `['second-order-ode', 'characteristic-equation', 'repeated-roots']`
 * resolves via 'second-order-ode', while one tagged
 * `['non-homogeneous-ode', 'resonance', ...]` resolves via
 * 'non-homogeneous-ode' — both correct even though both topics share the
 * generic 'characteristic-equation'-style vocabulary.
 */
export function mapPyqTagsToConceptId(topic: string, tags: string[] | undefined | null): string | null {
  if (!tags || tags.length === 0) return null;
  const map = TAG_MAPS[topic];
  if (!map) return null;
  for (const tag of tags) {
    const conceptId = map[tag];
    if (conceptId) return conceptId;
  }
  return null;
}

/**
 * Text-keyword rules for rows with no `tags` array — currently only
 * migration 035's 11 hand-inserted, machine-generated linear-algebra MCQs
 * (`source = 'generated_tier3'`). Each `match` is a literal, verified
 * substring of that specific question's text (lowercased), not a generic
 * keyword — every one was checked against 035_generated_content_provenance.sql's
 * actual question text before being written here.
 */
const TEXT_RULES: Array<{ topic: string; match: string; concept_id: string }> = [
  { topic: 'linear-algebra', match: '(a + aᵀ) is always', concept_id: 'symmetric-matrices' },
  { topic: 'linear-algebra', match: 'trace(ab) equals', concept_id: 'trace' },
  { topic: 'linear-algebra', match: 'det(a⁻¹) is', concept_id: 'determinants' },
  { topic: 'linear-algebra', match: 'infinitely many solutions when k equals', concept_id: 'systems-of-equations' },
  { topic: 'linear-algebra', match: 'eigenvector is proportional to', concept_id: 'eigenvalues' },
  { topic: 'linear-algebra', match: 'hamilton theorem states', concept_id: 'cayley-hamilton' },
  { topic: 'linear-algebra', match: 'is called orthogonal when', concept_id: 'orthogonality' },
  { topic: 'linear-algebra', match: 'every eigenvalue of a must be', concept_id: 'eigenvalues' },
  { topic: 'linear-algebra', match: 'lu decomposition a = lu', concept_id: 'lu-factorization' },
  { topic: 'linear-algebra', match: 'nullity theorem states', concept_id: 'rank-nullity' },
  { topic: 'linear-algebra', match: 'linearly independent in', concept_id: 'linear-independence' },
];

export function mapPyqTextToConceptId(topic: string, questionText: string | undefined | null): string | null {
  if (!questionText) return null;
  const lower = questionText.toLowerCase();
  for (const rule of TEXT_RULES) {
    if (rule.topic === topic && lower.includes(rule.match)) return rule.concept_id;
  }
  return null;
}

/**
 * Combined mapper: tag-based first (the strong signal), text-keyword as a
 * fallback for untagged rows. Returns null — never a guess — when neither
 * strategy confidently matches.
 */
export function mapPyqToConceptId(
  topic: string,
  tags: string[] | undefined | null,
  questionText: string | undefined | null,
): string | null {
  return mapPyqTagsToConceptId(topic, tags) ?? mapPyqTextToConceptId(topic, questionText);
}
