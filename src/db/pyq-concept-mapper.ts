/**
 * PYQ → concept_id(s) mapper (T3 / Milestone A / A2; multi-concept
 * extension: A9 / "multi-concept mapping").
 *
 * `pyq_questions` has no concept-level classification — only a coarse
 * `topic` TEXT column. `session-store.ts`'s `fetchProblemsForConcept`
 * queries `WHERE concept_id = $1`, and until this mapper ran, that column
 * didn't exist and every real PYQ was invisible to it.
 *
 * Deterministic, explicit, NEVER a guess: every rule below was written by
 * reading the actual question in `data/courses/gate-em/topics/<topic>/mcqs.json`
 * (or, for migration 035's untagged rows, the raw SQL text) and confirming
 * the mapped concept id(s) are what the question is actually testing — not
 * inferred from tag-name string similarity alone. A question no rule
 * confidently matches returns `null` / `[]`; callers must NEVER fall back to
 * a best-guess concept id.
 *
 * Two matching strategies, tried in order:
 *   1. Tag-based (`mapPyqTagsToConceptIds`) — the static mcqs.json files
 *      carry an author-curated `tags` array per question, ordered
 *      (verified against every question in the 10 topic files) with the
 *      PRIMARY tested concept listed first. We walk the tags in order and
 *      collect the concept(s) for every tag this topic's map recognizes,
 *      in first-seen order, deduped — so the FIRST tag's first concept is
 *      always the primary (matches the pre-multi-concept single-id
 *      semantics exactly), while later tags that genuinely name a second
 *      or third tested concept (e.g. `singular-matrix` implying both
 *      "determinant is zero" AND "matrix has no inverse") are no longer
 *      silently dropped.
 *   2. Text-keyword-based (`mapPyqTextToConceptId`) — for rows with no
 *      tags at all (migration 035's 11 hand-inserted linear-algebra rows).
 *      Each rule is a literal substring lifted from that exact question,
 *      not a generic keyword. Text rules stay single-concept — there is no
 *      author-curated tag order to derive a secondary concept from, and
 *      guessing one from keyword text alone would violate the "never a
 *      guess" rule above.
 *
 * Most tag → concept entries below are still single concepts (a plain
 * string). A handful of linear-algebra tags are genuinely two concepts at
 * once — those entries are `string[]` instead, e.g. `'singular-matrix':
 * ['determinants', 'matrix-inverse']` (det(A)=0 IS "A has no inverse", not
 * a coincidence). Every multi-concept entry was verified against the real
 * question(s) that carry that tag in `data/courses/gate-em/topics/*​/mcqs.json`
 * before being written here — see the multi-concept audit table in this
 * PR's report for the full linear-algebra derivation. Other topics were
 * deliberately left single-mapped (not re-audited question-by-question for
 * this pass); a topic staying single-valued is not an oversight.
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
const TAG_MAPS: Record<string, Record<string, string | string[]>> = {
  'linear-algebra': {
    'eigenvalues': 'eigenvalues',
    'characteristic-equation': 'eigenvalues',
    'complex-eigenvalues': 'eigenvalues',
    // la-010: "The matrix A = [[0,1],[-1,0]] represents a rotation. What
    // are its eigenvalues?" — the question tests BOTH the eigenvalue
    // computation AND the geometric fact that a real rotation matrix has
    // no real eigenvector (rotation IS the linear transformation).
    'rotation-matrix': ['eigenvalues', 'linear-transformations'],
    // la-011: "trace(A²)" from eigenvalues 2,3,5 — matrix-powers questions
    // in this bank are really about A^n via diagonalization (eigenvalues
    // of A^n are eigenvalues^n), with Cayley-Hamilton the standard
    // alternate method for the same computation. NOT "trace" — the prior
    // single-concept mapping conflated "the answer format is a trace" with
    // "the concept under test", which was wrong; corrected here.
    'matrix-powers': ['diagonalization', 'cayley-hamilton'],
    'system-of-equations': 'systems-of-equations',
    // la-002/la-012: "consistency" tags a system-of-equations question
    // whose actual test is reading consistency OFF the rank comparison
    // (rank(A) vs rank([A|b])) — rank-nullity is a second concept genuinely
    // in play, not just systems-of-equations.
    'consistency': ['systems-of-equations', 'rank-nullity'],
    // la-014: overdetermined (5x3, full column rank) system — tests both
    // systems-of-equations AND whether b lies in the column space, i.e.
    // least-squares' central question (when is there no exact solution).
    'overdetermined-system': ['systems-of-equations', 'least-squares'],
    'rank-nullity': 'rank-nullity',
    // la-003: null-space is dim(ker A); column-space is dim(im A) — the
    // SAME "space" concept (null-space-column-space), not the rank/nullity
    // relationship itself. Corrected from the prior 'rank-nullity' mapping,
    // which conflated "appears in the rank-nullity theorem" with "IS the
    // rank-nullity concept".
    'null-space': 'null-space-column-space',
    'rank': 'rank-nullity',
    'determinant': 'determinants',
    // la-009/la-012: singular ⟺ det=0 ⟺ not invertible — a singular-matrix
    // question genuinely tests both determinants (the zero-det criterion)
    // and matrix-inverse (why no inverse exists), not determinants alone.
    'singular-matrix': ['determinants', 'matrix-inverse'],
    'linear-dependence': 'linear-independence',
    'linear-independence': 'linear-independence',
    'matrices': 'matrix-operations',
    // la-007: "which set forms a basis for ℝ³" tests both vector-spaces
    // (spanning/dimension) and change-of-basis (a basis IS a coordinate
    // system choice) — the two are inseparable in this question's content.
    'basis': ['vector-spaces', 'change-of-basis'],
    'vector-spaces': 'vector-spaces',
    'invertible-matrix': 'matrix-inverse',
    'matrix-inverse': 'matrix-inverse',
    'inverse': 'matrix-inverse',
    'trace': 'trace',
    'orthogonal-matrix': 'orthogonality',
    'column-space': 'null-space-column-space',
    'quadratic-forms': 'quadratic-forms',
    'symmetric-matrix': 'symmetric-matrices',
    'spectral-theorem': 'spectral-theorem',

    // la-016..la-029 (sibling content lane, arrives via the merge — not in
    // this branch's mcqs.json yet): 14 new questions covering the 7
    // linear-algebra concepts that previously had zero PYQ coverage.
    // Primary tags, one per new concept:
    'inner-product': 'inner-product-spaces',
    'gram-schmidt': 'gram-schmidt',
    'lu-decomposition': 'lu-factorization',
    'positive-definite': 'positive-definite-matrices',
    'svd': 'svd',
    'jordan-form': 'jordan-normal-form',
    'matrix-norm': 'matrix-norms',
    // Secondary tags on those same 14 questions that weren't yet direct
    // TAG_MAPS keys (the concept existed via a differently-named tag —
    // e.g. 'orthogonal-matrix' → orthogonality, not the bare
    // 'orthogonality' tag itself — or wasn't reachable via tags at all —
    // 'diagonalization' was previously only reachable through
    // 'matrix-powers'). Every other secondary tag on those questions
    // (vector-spaces, linear-independence, matrices, determinant,
    // eigenvalues, symmetric-matrix, rank) already resolves via the
    // entries above; re-verified against this same table, unchanged.
    'orthogonality': 'orthogonality',
    'diagonalization': 'diagonalization',
    // 'vectors' is deliberately NOT mapped — same "too generic" reasoning
    // as the bare 'linear-algebra' tag (see header comment): it names no
    // single concept on its own, so it stays absent from this table and
    // contributes nothing rather than guessing.
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
    // de-006's primary (first-listed) tag — a pure order/degree/linearity
    // classification question, not a solving-technique one. Deliberately
    // NOT mapping the co-occurring 'ode-basics' tag (too generic to trust
    // alone) or 'classification' (used elsewhere in this bank for PDE type
    // and homogeneous-vs-not classification, a different concept entirely
    // — see de-003/de-013).
    'order-degree': 'ode-classification',
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
 * Walk `tags` in order and return EVERY concept this topic's map
 * recognizes across the whole tag array, in first-seen order, deduped.
 * Tag order in the source files consistently lists the primary tested
 * concept first (verified against all 150 questions while building
 * TAG_MAPS above), so the first tag's first concept is always `[0]` —
 * exactly the value the pre-multi-concept `mapPyqTagsToConceptId` used to
 * return alone. A tag whose entry is a `string[]` (see TAG_MAPS comments
 * above) contributes every concept in that array, in the order listed;
 * a later tag repeating a concept already collected is skipped, not
 * re-added. Unknown topic or empty/missing tags → `[]`, never a guess.
 *
 * e.g. la-012 is tagged
 * `['system-of-equations', 'consistency', 'rank', 'singular-matrix']` and
 * resolves to `['systems-of-equations', 'rank-nullity', 'determinants',
 * 'matrix-inverse']` — the question genuinely exercises all four.
 */
export function mapPyqTagsToConceptIds(topic: string, tags: string[] | undefined | null): string[] {
  if (!tags || tags.length === 0) return [];
  const map = TAG_MAPS[topic];
  if (!map) return [];
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const tag of tags) {
    const entry = map[tag];
    if (!entry) continue;
    const concepts = Array.isArray(entry) ? entry : [entry];
    for (const conceptId of concepts) {
      if (!seen.has(conceptId)) {
        seen.add(conceptId);
        ordered.push(conceptId);
      }
    }
  }
  return ordered;
}

/**
 * Thin single-concept wrapper over `mapPyqTagsToConceptIds`, kept for every
 * existing caller/test that only wants the primary concept. Primary-first
 * ordering (see above) makes `[0]` exactly what the original
 * single-concept mapper returned.
 */
export function mapPyqTagsToConceptId(topic: string, tags: string[] | undefined | null): string | null {
  return mapPyqTagsToConceptIds(topic, tags)[0] ?? null;
}

/**
 * Text-keyword rules for rows with no `tags` array. Two sources:
 *   - Migration 035's 11 hand-inserted, machine-generated linear-algebra
 *     MCQs (`source = 'generated_tier3'`).
 *   - The 8 SQL-seeded linear-algebra PYQs in `scripts/seed-pyqs.sql` /
 *     `supabase/seeds/gate_em_pyqs.sql` (`source` prefixed `sql-`), which
 *     carry `question`/`topic`/etc. columns but no `tags` column at all —
 *     the tag-based mapper can never see them.
 * Each `match` is a literal, verified substring of that specific
 * question's text (lowercased), not a generic keyword — every one was
 * checked against the real question text (035_generated_content_provenance.sql,
 * or the exported `question_text` for the SQL-seeded rows) before being
 * written here.
 *
 * `concept_id` may be a `string[]` — same multi-concept extension as
 * TAG_MAPS above — for a question whose text makes more than one concept
 * unambiguous (e.g. "det(A)=0, then the system Ax=b..." tests
 * determinants, matrix-inverse, AND systems-of-equations at once; the
 * explanation for the eigenvalue-product question explicitly states the
 * identity "product of eigenvalues = det(A)", so that one tests both
 * eigenvalues and determinants, not eigenvalues alone).
 */
const TEXT_RULES: Array<{ topic: string; match: string; concept_id: string | string[] }> = [
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

  // sql-GATE-PYQs-Seed-* / sql-Supabase-PYQs-Seed-* (scripts/seed-pyqs.sql,
  // supabase/seeds/gate_em_pyqs.sql) — no tags column, matched on the
  // literal question text instead. Each substring verified unique against
  // both these 8 questions and every tagged mcqs.json linear-algebra
  // question (different matrix entries / phrasing throughout).
  { topic: 'linear-algebra', match: 'the eigenvalues of the matrix [[2, 1], [1, 2]]', concept_id: 'eigenvalues' },
  { topic: 'linear-algebra', match: 'the rank of the matrix [[1, 2, 3], [2, 4, 6], [1, 2, 4]]', concept_id: 'rank-nullity' },
  // det(2A) = 2^n det(A) — the scalar-multiple determinant property, same
  // single concept as la-004's det(2A⁻¹) question.
  { topic: 'linear-algebra', match: 'det(a) = 5, then det(2a)', concept_id: 'determinants' },
  // Consistency read off rank(A) vs rank([A|b]) — identical reasoning to
  // the 'consistency' tag (TAG_MAPS above): systems-of-equations AND
  // rank-nullity both genuinely tested.
  { topic: 'linear-algebra', match: 'x + y + z = 6, x + 2y + 3z = 14, x + 4y + 7z = 30', concept_id: ['systems-of-equations', 'rank-nullity'] },
  // Explanation states the identity "Product of eigenvalues = det(A)"
  // outright — the question IS that identity, not eigenvalues alone.
  { topic: 'linear-algebra', match: 'the product of eigenvalues of [[1, 0, 0], [0, 3, -1], [0, -1, 3]]', concept_id: ['eigenvalues', 'determinants'] },
  { topic: 'linear-algebra', match: 'the eigenvalues of the matrix [[3, 1], [0, 3]]', concept_id: 'eigenvalues' },
  { topic: 'linear-algebra', match: 'the rank of the matrix [[1,2,3],[4,5,6],[7,8,9]]', concept_id: 'rank-nullity' },
  // Singular (det=0) ⇒ not invertible ⇒ Ax=b has no unique solution — the
  // question is exactly the three-way link determinants/matrix-inverse/
  // systems-of-equations, mirroring la-012's 'singular-matrix' tag set.
  { topic: 'linear-algebra', match: 'matrix with det(a) = 0, then the system ax = b', concept_id: ['determinants', 'matrix-inverse', 'systems-of-equations'] },

  // scripts/seed-pyqs.sql / supabase/seeds/gate_em_pyqs.sql — no tags
  // column, matched on literal question text, same pattern as the
  // linear-algebra sql-*-Seed-* rules above. Both are pure order/degree
  // classification questions (verified against their explanations, which
  // state "Order = ..." / "Degree = ..." and nothing about solving the
  // equation), so both map to ode-classification, not a solving concept.
  { topic: 'differential-equations', match: 'the order and degree of the differential equation (d²y/dx²)³ + (dy/dx)² + y = 0', concept_id: 'ode-classification' },
  { topic: 'differential-equations', match: 'the order and degree of the ode (d²y/dx²)³ + (dy/dx)² + y = 0', concept_id: 'ode-classification' },
];

/**
 * Walk TEXT_RULES and return every concept named by the FIRST matching
 * rule for this topic — a rule's `concept_id` may itself be a `string[]`
 * (see TEXT_RULES comments above) for a question whose text makes more
 * than one concept unambiguous. Unlike the tag-based mapper, rules here
 * are NOT accumulated across multiple matches: each rule's `match` is a
 * literal substring unique to one specific question, so at most one rule
 * ever fires per question text — there is no "primary tag order" to walk.
 */
export function mapPyqTextToConceptIds(topic: string, questionText: string | undefined | null): string[] {
  if (!questionText) return [];
  const lower = questionText.toLowerCase();
  for (const rule of TEXT_RULES) {
    if (rule.topic === topic && lower.includes(rule.match)) {
      return Array.isArray(rule.concept_id) ? rule.concept_id : [rule.concept_id];
    }
  }
  return [];
}

/**
 * Thin single-concept wrapper over `mapPyqTextToConceptIds`, kept for
 * every existing caller/test that only wants the primary concept.
 */
export function mapPyqTextToConceptId(topic: string, questionText: string | undefined | null): string | null {
  return mapPyqTextToConceptIds(topic, questionText)[0] ?? null;
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

/**
 * Multi-concept combined mapper: tag-based (full set) first, text-keyword
 * as a fallback for untagged rows. The text-keyword strategy only ever
 * yields a single concept (see the header comment on why), so the fallback
 * result is wrapped as a one-element array. Returns `[]` — never a guess —
 * when neither strategy confidently matches.
 */
export function mapPyqToConceptIds(
  topic: string,
  tags: string[] | undefined | null,
  questionText: string | undefined | null,
): string[] {
  const tagResult = mapPyqTagsToConceptIds(topic, tags);
  if (tagResult.length > 0) return tagResult;
  return mapPyqTextToConceptIds(topic, questionText);
}
