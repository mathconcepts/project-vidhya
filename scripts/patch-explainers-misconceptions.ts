// @ts-nocheck
/**
 * Curated Explainers Patch
 *
 * Updates frontend/public/data/explainers.json with hand-curated
 * common_misconceptions arrays for the highest-value concepts. These
 * misconceptions are sourced from established math-pedagogy references
 * (Khan Academy, MIT OCW problem commentary, MAA and NCTM literature on
 * student difficulties) and from common GATE paper solution explanations.
 *
 * Each misconception follows the "description ... because ..." grammar
 * the Lesson composer parses, so it surfaces correctly in the
 * common_traps component.
 *
 * Runs offline — no API key required. Usage:
 *   npx tsx scripts/patch-explainers-misconceptions.ts
 */

import fs from 'fs';
import path from 'path';

const OUT_PATH = path.resolve(process.cwd(), 'frontend/public/data/explainers.json');

// ============================================================================
// Curated misconceptions by concept_id. Each entry is phrased as
//   "<the mistake> because <why it happens>"
// so the Lesson composer's parser picks up both halves into trap.description
// and trap.why_it_happens.
// ============================================================================

const CURATED: Record<string, string[]> = {
  eigenvalues: [
    "Students compute det(A - λI) but forget to solve for λ because they stop once they see a polynomial",
    "Students conflate algebraic multiplicity with geometric multiplicity because both are called 'multiplicity'",
    "Students assume every matrix has distinct eigenvalues because their early examples always did",
    "Students treat eigenvectors as unique vectors because they don't recognize scalar multiples of an eigenvector are also eigenvectors",
    "Students forget that complex eigenvalues come in conjugate pairs for real matrices because they only practiced with symmetric matrices",
  ],

  determinants: [
    "Students compute determinants by expanding along the wrong row/column because they don't pick the row or column with the most zeros",
    "Students apply the det(AB) = det(A)·det(B) rule to non-square matrices because they memorize without checking preconditions",
    "Students think det(A + B) = det(A) + det(B) because sums usually distribute over operations",
    "Students compute det(kA) as k·det(A) because scalar multiplication usually commutes with linear operations",
    "Students forget that swapping two rows negates the determinant because they only remember the magnitude",
  ],

  'rank-nullity': [
    "Students count nonzero rows in the original matrix instead of the row-echelon form because they skip the reduction step",
    "Students confuse rank with determinant because both 'describe' the matrix as a whole",
    "Students think rank + nullity equals the number of rows because they misremember which dimension is being summed",
    "Students apply row reduction inconsistently and miscount pivots because they treat each row independently",
    "Students forget that rank(AB) ≤ min(rank(A), rank(B)) because they expect ranks to add or multiply",
  ],

  'matrix-operations': [
    "Students multiply matrices element-wise because they confuse matrix multiplication with Hadamard product",
    "Students assume AB = BA because real-number multiplication commutes",
    "Students compute A⁻¹ by inverting each entry because inversion feels like 'the reverse of' multiplication",
    "Students check if a product is defined by counting entries because they don't track rows × columns dimensions",
    "Students apply transpose distribution as (AB)ᵀ = AᵀBᵀ because they expect the order to stay the same",
  ],

  'systems-of-equations': [
    "Students use Cramer's rule when det = 0 because they don't check the coefficient matrix first",
    "Students treat any system with more equations than unknowns as inconsistent because they expect 'too many' equations to conflict",
    "Students back-substitute before reaching row-echelon form because they try to solve partway through elimination",
    "Students confuse 'no solution' with 'infinite solutions' because both produce rows of zeros in reduction",
    "Students forget to multiply through by the pivot before adding rows because they memorize the procedure by rote",
  ],

  diagonalization: [
    "Students try to diagonalize a non-diagonalizable matrix because they don't check algebraic vs geometric multiplicity",
    "Students compute PDP⁻¹ but forget to order eigenvalues and eigenvectors consistently because the pairing is easy to mix up",
    "Students think all symmetric matrices need Gram-Schmidt because they conflate symmetric with orthogonal diagonalization",
    "Students write P as rows of eigenvectors instead of columns because they confuse the convention",
    "Students compute A^n by raising entries to the n-th power because they forget diagonalization transforms the problem",
  ],

  limits: [
    "Students substitute x = a directly when the result is 0/0 because they don't recognize indeterminate forms",
    "Students apply L'Hôpital's rule to limits that aren't 0/0 or ∞/∞ because they overuse the tool",
    "Students conflate limit at infinity with limit at a point because both use the same notation lim",
    "Students take one-sided limits as equal without checking because two-sided limits are the usual case",
    "Students forget that limits can exist where the function value doesn't because they expect f(a) and lim(x→a) f(x) to always agree",
  ],

  continuity: [
    "Students check only lim(x→a) f(x) = f(a) but forget f(a) must exist because they focus on the limit side",
    "Students confuse removable discontinuities with jump discontinuities because both break 'smooth' graphs",
    "Students think piecewise functions are automatically discontinuous at the join because they don't check the match",
    "Students assert continuity from a graph that looks smooth because visual estimation isn't rigorous",
    "Students apply the IVT to discontinuous functions because they don't check the hypothesis",
  ],

  differentiability: [
    "Students assume continuity implies differentiability because the converse (differentiable ⇒ continuous) is easy to remember backward",
    "Students differentiate across corner points like |x| at x=0 because the function is continuous there",
    "Students use the derivative formula inside an absolute value without checking sign because they don't split cases",
    "Students forget that vertical tangents are a form of non-differentiability because the function is still 'smooth'",
    "Students conflate f'(a) existing with f being differentiable on an interval because they mix pointwise with global",
  ],

  'derivatives-basic': [
    "Students forget the '+C' when writing antiderivatives because the constant feels optional",
    "Students apply the power rule to constants as '0·x⁻¹' instead of 0 because they don't track the special case",
    "Students differentiate constants using the power rule and get 0·x⁻¹ (undefined) because they don't apply d/dx(c) = 0 first",
    "Students mix up d/dx(eˣ) = eˣ with d/dx(xᵉ) = e·xᵉ⁻¹ because the forms look similar",
    "Students forget that d/dx(sin(x)) is cos(x) not -cos(x) because both sine and cosine have alternating-sign derivatives",
  ],

  'chain-rule': [
    "Students differentiate f(g(x)) as f'(x)·g'(x) because they forget the inner function's argument",
    "Students apply the chain rule to non-composite functions because they over-apply the pattern",
    "Students stop after one level of chain in f(g(h(x))) because they only see two functions",
    "Students forget to differentiate the inner function because visually it looks 'done' after step one",
    "Students apply d/dx to both sides of an equation without the chain rule (implicit differentiation) because they treat y as a constant",
  ],

  'integration-basics': [
    "Students integrate ∫(f·g) dx as (∫f)·(∫g) because they pattern-match on addition-distributes rules",
    "Students forget to add the constant of integration because definite integrals don't need it",
    "Students split ∫dx/(x² + 1) as tan⁻¹(x²+1) because they mis-identify the antiderivative pattern",
    "Students apply u-substitution but forget to change the limits of integration because they keep original bounds",
    "Students integrate cos²(x) by writing (cos(x))²/2 because they treat it like the power rule",
  ],

  'integration-by-parts': [
    "Students pick u and dv at random because they don't follow the LIATE heuristic",
    "Students forget to apply integration by parts recursively when the new integral is still complex because one pass feels sufficient",
    "Students drop the boundary term uv evaluated at limits because they focus on the integral piece",
    "Students swap the sign and write ∫u dv = uv + ∫v du because they miscopy the formula",
    "Students use integration by parts on integrals that need substitution because they over-apply the technique",
  ],

  'definite-integrals': [
    "Students compute F(a) - F(b) instead of F(b) - F(a) because they reverse the bounds",
    "Students ignore the sign of the integrand and report area as always positive because they expect area to be non-negative",
    "Students change variable but keep the original limits because they forget to transform the bounds",
    "Students split an integral at a point of discontinuity but compute it as if continuous because they don't notice the discontinuity",
    "Students apply the fundamental theorem of calculus when F is not continuous on [a,b] because they don't verify the hypothesis",
  ],

  'multivariable-calculus': [
    "Students treat all variables as functions of x when computing ∂/∂x because they confuse total with partial derivatives",
    "Students forget to hold other variables constant because they're used to single-variable calculus",
    "Students compute ∂²f/∂x∂y and ∂²f/∂y∂x and get different answers because they make algebra errors, not because Clairaut fails",
    "Students apply the chain rule in partials without accounting for all paths because they miss intermediate variables",
    "Students confuse ∂z/∂x with dz/dx because the notation looks similar",
  ],

  'taylor-laurent': [
    "Students drop the remainder term when computing approximations because they think the series is exact",
    "Students compute Taylor series about x = 0 when the problem asks about x = a because they default to Maclaurin",
    "Students forget to evaluate the n-th derivative at the expansion point because they leave f⁽ⁿ⁾(x) in the coefficient",
    "Students assume the Taylor series converges everywhere because the formula looks universal",
    "Students confuse the Taylor series of f with its Taylor polynomial because both share the same formula for finite n",
  ],

  'ode-first-order': [
    "Students forget to multiply BOTH sides by the integrating factor because they treat the equation as an identity",
    "Students compute the integrating factor as e^P(x) instead of e^∫P(x)dx because they skip the integral",
    "Students drop the constant of integration on the integrating factor because it simplifies to 1 anyway",
    "Students apply the first-order-linear method to nonlinear equations because they pattern-match on the form y' + P(x)y = Q(x)",
    "Students forget that the solution must be continuous on the interval of interest because they solve piece-by-piece",
  ],

  'ode-second-order-homo': [
    "Students write only one solution for repeated roots because they forget the te^(rt) term",
    "Students use the wrong form for complex roots because they don't convert to e^(αx)(cos(βx) + sin(βx))",
    "Students mix up the characteristic equation form because they confuse ay'' + by' + cy = 0 with y'' + by' + cy = 0",
    "Students assert that the general solution has only two constants because they forget higher-order equations need more",
    "Students apply constant-coefficient methods to variable-coefficient equations because the surface structure looks the same",
  ],

  'ode-second-order-nonhomo': [
    "Students try undetermined coefficients with a forcing term that duplicates a homogeneous solution because they don't multiply by x",
    "Students forget that the general solution is the sum of complementary and particular solutions because they produce only one",
    "Students assume variation of parameters always works better than undetermined coefficients because more general sounds better",
    "Students pick the wrong form for the particular solution because they don't match the forcing function structure",
    "Students apply superposition to nonlinear equations because linear-combination habit is strong",
  ],

  'probability-basics': [
    "Students compute P(A|B) as P(B|A) because they swap the conditional direction",
    "Students forget to normalize by the total probability in Bayes' theorem because they skip the denominator",
    "Students assume P(A|B) + P(A|B^c) = 1 because they confuse it with P(A) + P(A^c) = 1",
    "Students treat independent events as mutually exclusive because both 'decouple' events intuitively",
    "Students add probabilities of overlapping events without subtracting the intersection because inclusion-exclusion feels unnecessary",
  ],

  'complex-integration': [
    "Students verify only the first of the two Cauchy-Riemann equations before calling a function holomorphic because they stop at the first check",
    "Students apply Cauchy's theorem when the contour encloses a singularity because they forget to check analyticity inside the contour",
    "Students compute residues at essential singularities using the pole formula because they treat all singularities the same",
    "Students forget to pick the correct branch when integrating around multi-valued functions because they use the principal branch automatically",
    "Students apply the residue theorem to non-closed contours because they overgeneralize the scope",
  ],

  'laplace-transform': [
    "Students forget the shift property L{e^(at) f(t)} = F(s - a) and apply L{f(t)} directly because they ignore the exponential",
    "Students use the initial value from the problem instead of 0 in the derivative property because they confuse the formula",
    "Students apply the inverse Laplace transform term-by-term without partial-fraction decomposition because they hope the transform is additive",
    "Students compute L{f(t)g(t)} as F(s)·G(s) because convolution-in-time (not product-in-time) corresponds to multiplication-in-frequency",
    "Students try to invert F(s) = 1/(s² + 2s + 5) directly because they don't complete the square first",
  ],
};

// ============================================================================
// Patcher
// ============================================================================

function main() {
  const raw = JSON.parse(fs.readFileSync(OUT_PATH, 'utf-8'));
  const byConcept = raw.by_concept || {};

  let patched = 0;
  let skipped = 0;
  let missing = 0;

  for (const [conceptId, misconceptions] of Object.entries(CURATED)) {
    const entry = byConcept[conceptId];
    if (!entry) {
      console.log(`  MISSING in explainers.json: ${conceptId}`);
      missing++;
      continue;
    }
    if (Array.isArray(entry.common_misconceptions) && entry.common_misconceptions.length > 0) {
      skipped++;
      continue;
    }
    entry.common_misconceptions = misconceptions;
    patched++;
  }

  // Update top-level metadata
  raw.generated_at = new Date().toISOString();
  raw.note = 'Curated misconceptions patched offline (no LLM) for top 22 concepts. Re-run scripts/build-explainers.ts with GEMINI_API_KEY to regenerate the rest.';
  raw.curated_misconception_concepts = Object.keys(CURATED).length;

  fs.writeFileSync(OUT_PATH, JSON.stringify(raw, null, 2));

  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║ Explainer misconceptions patched     ║`);
  console.log(`╟──────────────────────────────────────╢`);
  console.log(`║ Patched:  ${String(patched).padStart(3)} concepts               ║`);
  console.log(`║ Skipped:  ${String(skipped).padStart(3)} (already had content)  ║`);
  console.log(`║ Missing:  ${String(missing).padStart(3)} (not in explainers)    ║`);
  console.log(`║ Remaining empty: ${String(82 - patched - skipped).padStart(2)} of 82             ║`);
  console.log(`╚══════════════════════════════════════╝`);
}

main();
