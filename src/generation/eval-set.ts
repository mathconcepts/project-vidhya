/**
 * The judge's eval set.
 *
 * A judge nobody measured is an approval stamp with no evidence behind it. It
 * will pass everything, the corpus will look gated, and the first wrong number
 * to reach a student will be the first anyone finds out. So the judge does not
 * get to gate 566 files on the strength of a well-written prompt.
 *
 * Forty labelled pairs. Thirty are legitimate rewrites the judge must ACCEPT —
 * shorter, replainer, reordered, differently phrased. Ten are corrupted in the
 * specific ways a rewrite actually breaks, and the judge must REJECT them.
 *
 * The thirty acceptances matter as much as the ten rejections. A judge that
 * rejects everything scores perfect recall on the corruptions and is worth
 * nothing, because every one of the 566 variants would land in the draft folder
 * and a human would have to read all of them — which is the situation the judge
 * exists to avoid. Precision is why the accept cases are here.
 *
 * ── The corruptions are drawn from what has actually gone wrong ─────────
 *
 * Not invented failure modes. `dropped-invertibility`, `dropped-nonzero` and
 * `dropped-domain` are the omission class the compression budget produces.
 * `hook-lost-motivation` is a real regression this repo shipped by hand:
 * rewriting `orthogonality/hook-shaken.md` for length dropped the paragraph
 * giving the reason to care, with seven words of budget unused.
 * `changed-final-answer` and `changed-intermediate` are the failures the
 * structural gate cannot see once the number lives in prose rather than in a
 * walkthrough `answer` field.
 *
 * ── This has not been run against a live model ──────────────────────────
 *
 * No reachable LLM provider is configured in the environment this was written
 * in. `scoreJudge` and every pair below are tested against stub judges only.
 * The numbers a real model scores here are unknown, and until they are known
 * the judge is unvalidated. See variant-judge.ts.
 */

export interface EvalPair {
  id: string;
  atomType: 'hook' | 'intuition' | 'worked_example';
  base: string;
  variant: string;
  /** true when the rewrite is legitimate and the judge should agree. */
  shouldAgree: boolean;
  /** For a corrupted pair, what was broken. Empty for legitimate rewrites. */
  corruption?: string;
}

/** Pairs the judge must ACCEPT — real compressions and real expansions. */
const LEGITIMATE: EvalPair[] = [
  {
    id: 'ok-eigen-hook-shorter',
    atomType: 'hook',
    base: 'Rotate a picture and almost every arrow in it swings to a new direction. A handful do not — they only get longer or shorter. Those survivors are what let you take a matrix apart and understand it, and they are why eigenvalues show up in every stability question on the paper.',
    variant: 'Rotate a picture and almost every arrow swings somewhere new. A few only stretch. Those are the ones that let you take the matrix apart, which is why stability questions come back to them.',
    shouldAgree: true,
  },
  {
    id: 'ok-eigen-hook-reordered',
    atomType: 'hook',
    base: 'Eigenvalues answer one question: which directions does this matrix leave alone? Every stability problem on the exam reduces to that question.',
    variant: 'Every stability problem on the exam reduces to one question — which directions does this matrix leave alone? That is what an eigenvalue tells you.',
    shouldAgree: true,
  },
  {
    id: 'ok-det-hook-plainer',
    atomType: 'hook',
    base: 'The determinant measures how much a linear map inflates or deflates volume. When it is zero the map has flattened space, and flattening cannot be undone — which is precisely why a zero determinant means no inverse.',
    variant: 'The determinant is how much a map stretches volume. Zero means it flattened space, and you cannot unflatten. That is why zero determinant means no inverse.',
    shouldAgree: true,
  },
  {
    id: 'ok-orth-hook-kept-stake',
    atomType: 'hook',
    base: 'Two vectors are orthogonal when neither casts any shadow on the other. That independence is what makes an orthogonal basis so cheap to compute with: no component of one direction leaks into another, so projection becomes a single dot product instead of solving a system.',
    variant: 'Orthogonal means neither vector casts a shadow on the other. Nothing leaks between directions, so a projection is one dot product instead of a whole system to solve — that is why an orthogonal basis is worth building.',
    shouldAgree: true,
  },
  {
    id: 'ok-rank-hook',
    atomType: 'hook',
    base: 'Rank counts how many directions a matrix can actually reach. It is the single number that decides whether a system has one solution, none, or infinitely many.',
    variant: 'Rank is how many directions the matrix can reach. That one number decides whether a system has one solution, none, or infinitely many.',
    shouldAgree: true,
  },
  {
    id: 'ok-hook-expanded-assured-to-shaken',
    atomType: 'hook',
    base: 'Diagonalisation turns matrix powers into scalar powers.',
    variant: 'Raising a matrix to the tenth power by hand is miserable. Diagonalisation turns that job into raising a few plain numbers to the tenth power instead, which is the whole reason anyone bothers with it.',
    shouldAgree: true,
  },
  {
    id: 'ok-trace-hook',
    atomType: 'hook',
    base: 'The trace is the cheapest thing you can learn about a matrix: add the diagonal. It also happens to equal the sum of the eigenvalues, which turns it into a free sanity check on any characteristic polynomial you solve.',
    variant: 'Add the diagonal and you have the trace — the cheapest fact about a matrix. It equals the sum of the eigenvalues, so it is a free check on any characteristic polynomial you solve.',
    shouldAgree: true,
  },
  {
    id: 'ok-nullspace-hook',
    atomType: 'hook',
    base: 'The null space collects everything the matrix destroys. Knowing its size tells you exactly how much information the map threw away.',
    variant: 'The null space is everything the matrix sends to zero. Its size is how much information the map threw away.',
    shouldAgree: true,
  },
  {
    id: 'ok-eigen-intuition-kept-condition',
    atomType: 'intuition',
    base: 'Picture the matrix acting on every vector at once. Most get turned. An eigenvector is one that comes back pointing along the same line, scaled by $\\lambda$. Note that the zero vector is excluded by definition — it satisfies the equation for every $\\lambda$ and so would tell you nothing.',
    variant: 'Most vectors get turned by a matrix. An eigenvector comes back on the same line, just scaled by $\\lambda$. Zero is excluded: it works for every $\\lambda$, so it says nothing.',
    shouldAgree: true,
  },
  {
    id: 'ok-intuition-analogy-bounded',
    atomType: 'intuition',
    base: 'Think of a linear map as a machine that stretches a rubber sheet. The analogy holds for the geometry but breaks for orientation — a reflection also stretches nothing and still flips the sheet over.',
    variant: 'A linear map stretches a rubber sheet. The picture works for the geometry, not for orientation: a reflection stretches nothing and still flips the sheet.',
    shouldAgree: true,
  },
  {
    id: 'ok-intuition-projection',
    atomType: 'intuition',
    base: 'Projecting $v$ onto $u$ asks: how much of $v$ points along $u$? Drop a perpendicular from the tip of $v$ to the line through $u$; where it lands is the projection. This needs $u \\neq 0$, since a zero vector spans no line to project onto.',
    variant: 'Projection asks how much of $v$ lies along $u$. Drop a perpendicular from $v$ onto the line through $u$. You need $u \\neq 0$ — a zero vector gives you no line.',
    shouldAgree: true,
  },
  {
    id: 'ok-intuition-det-sign',
    atomType: 'intuition',
    base: 'The sign of the determinant records orientation. Positive means the map preserved handedness; negative means it turned the space inside out. The magnitude, separately, is the volume factor.',
    variant: 'Sign records orientation — positive keeps handedness, negative flips it. Magnitude is the volume factor. Two separate pieces of information.',
    shouldAgree: true,
  },
  {
    id: 'ok-intuition-basis',
    atomType: 'intuition',
    base: 'A basis is a minimal set of directions that still reaches everywhere. Drop one and you lose part of the space; add one and it is redundant, because the new vector was already a combination of the others.',
    variant: 'A basis is the smallest set of directions that still reaches everywhere. Remove one and you lose part of the space. Add one and it is redundant — it was already a combination of the rest.',
    shouldAgree: true,
  },
  {
    id: 'ok-intuition-rank-nullity',
    atomType: 'intuition',
    base: 'Every input dimension has to go somewhere: either it survives into the image or it collapses into the null space. Nothing can do both and nothing can do neither, which is the whole content of rank plus nullity equalling $n$.',
    variant: 'Each input dimension either survives into the image or collapses into the null space. Never both, never neither. That is rank plus nullity equals $n$.',
    shouldAgree: true,
  },
  {
    id: 'ok-intuition-similar-matrices',
    atomType: 'intuition',
    base: 'Similar matrices are the same map written in two different bases. That is why they share eigenvalues, trace and determinant — those quantities describe the map, not the coordinates you chose to write it in.',
    variant: 'Two similar matrices are one map in two different bases. Eigenvalues, trace and determinant describe the map itself, not the coordinates, so they agree.',
    shouldAgree: true,
  },
  {
    id: 'ok-intuition-orthogonal-matrix',
    atomType: 'intuition',
    base: 'An orthogonal matrix moves the space without distorting it: lengths and angles come out unchanged. Its columns form an orthonormal set, which is exactly the condition $Q^TQ = I$ written out.',
    variant: 'An orthogonal matrix moves space without distorting it — lengths and angles survive. Its columns are orthonormal, which is what $Q^TQ = I$ says.',
    shouldAgree: true,
  },
  {
    id: 'ok-intuition-eigenspace',
    atomType: 'intuition',
    base: 'All the eigenvectors for one $\\lambda$, together with zero, form a subspace. Zero has to be included for it to be a subspace at all, even though it is not itself an eigenvector.',
    variant: 'The eigenvectors for a given $\\lambda$, plus zero, form a subspace. Zero is included so it is a subspace, though zero is not an eigenvector.',
    shouldAgree: true,
  },
  {
    id: 'ok-intuition-linear-independence',
    atomType: 'intuition',
    base: 'Vectors are independent when no one of them can be built from the others. Test it by asking whether any combination adds to zero using coefficients that are not all zero — if one exists, something was redundant.',
    variant: 'Independent means no vector is buildable from the rest. Ask whether some combination hits zero with coefficients not all zero; if it does, one was redundant.',
    shouldAgree: true,
  },
  {
    id: 'ok-we-eigen-split-steps',
    atomType: 'worked_example',
    base: 'Take $A = \\begin{pmatrix} 4 & 1 \\\\ 2 & 3 \\end{pmatrix}$. Form $A - \\lambda I$, take the determinant, and solve $\\lambda^2 - 7\\lambda + 10 = 0$ to get $\\lambda = 5$ and $\\lambda = 2$.',
    variant: 'Take $A = \\begin{pmatrix} 4 & 1 \\\\ 2 & 3 \\end{pmatrix}$.\n\nFirst subtract $\\lambda$ down the diagonal to get $A - \\lambda I$.\n\nNow take its determinant. That gives $\\lambda^2 - 7\\lambda + 10 = 0$.\n\nFactor it: the roots are $\\lambda = 5$ and $\\lambda = 2$.',
    shouldAgree: true,
  },
  {
    id: 'ok-we-inverse-kept-condition',
    atomType: 'worked_example',
    base: 'Assuming $\\det A \\neq 0$, the inverse is $A^{-1} = \\frac{1}{\\det A}\\operatorname{adj}A$. For $A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 1 \\end{pmatrix}$ the determinant is $1$, so $A^{-1} = \\begin{pmatrix} 1 & -1 \\\\ -1 & 2 \\end{pmatrix}$.',
    variant: 'This only works when $\\det A \\neq 0$.\n\nCheck first: for $A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 1 \\end{pmatrix}$, $\\det A = 1$. Not zero, so carry on.\n\nThen $A^{-1} = \\frac{1}{\\det A}\\operatorname{adj}A = \\begin{pmatrix} 1 & -1 \\\\ -1 & 2 \\end{pmatrix}$.',
    shouldAgree: true,
  },
  {
    id: 'ok-we-merged-steps',
    atomType: 'worked_example',
    base: 'Start with $3x + 6 = 18$. Subtract $6$ from both sides to get $3x = 12$. Divide both sides by $3$ to get $x = 4$.',
    variant: 'From $3x + 6 = 18$, subtract $6$ and divide by $3$ in one go: $x = 4$.',
    shouldAgree: true,
  },
  {
    id: 'ok-we-projection',
    atomType: 'worked_example',
    base: 'Project $v = (3,4)$ onto $u = (1,0)$. The formula is $\\frac{v \\cdot u}{u \\cdot u}u$, valid for $u \\neq 0$. Here $v \\cdot u = 3$ and $u \\cdot u = 1$, so the projection is $(3,0)$.',
    variant: 'Project $v = (3,4)$ onto $u = (1,0)$.\n\n$u$ is not the zero vector, so the formula $\\frac{v \\cdot u}{u \\cdot u}u$ applies.\n\n$v \\cdot u = 3$. $u \\cdot u = 1$. So the projection is $(3,0)$.',
    shouldAgree: true,
  },
  {
    id: 'ok-we-quadratic',
    atomType: 'worked_example',
    base: 'Solve $x^2 - 5x + 6 = 0$. Factor as $(x-2)(x-3) = 0$, giving $x = 2$ or $x = 3$.',
    variant: 'Solve $x^2 - 5x + 6 = 0$.\n\nLook for two numbers multiplying to $6$ and adding to $-5$: those are $-2$ and $-3$.\n\nSo $(x-2)(x-3) = 0$, and $x = 2$ or $x = 3$.',
    shouldAgree: true,
  },
  {
    id: 'ok-we-determinant-3x3',
    atomType: 'worked_example',
    base: 'Expand $\\det\\begin{pmatrix} 1 & 2 & 3 \\\\ 0 & 1 & 4 \\\\ 0 & 0 & 2 \\end{pmatrix}$ along the first column. Only the top entry is non-zero, so the determinant is $1 \\times \\det\\begin{pmatrix} 1 & 4 \\\\ 0 & 2 \\end{pmatrix} = 2$.',
    variant: 'The matrix is upper triangular, so expanding down the first column leaves one term: $1 \\times \\det\\begin{pmatrix} 1 & 4 \\\\ 0 & 2 \\end{pmatrix}$, which is $2$.',
    shouldAgree: true,
  },
  {
    id: 'ok-we-integration-domain',
    atomType: 'worked_example',
    base: 'Evaluate $\\int_1^e \\frac{1}{x}\\,dx$. On $[1,e]$ the integrand is continuous because $x$ never reaches zero, so the fundamental theorem applies: the value is $\\ln e - \\ln 1 = 1$.',
    variant: 'Evaluate $\\int_1^e \\frac{1}{x}\\,dx$.\n\n$x$ stays away from zero on $[1,e]$, so the integrand is continuous and the fundamental theorem applies.\n\n$\\ln e - \\ln 1 = 1$.',
    shouldAgree: true,
  },
  {
    id: 'ok-we-limit',
    atomType: 'worked_example',
    base: 'Find $\\lim_{x \\to 0} \\frac{\\sin x}{x}$. Direct substitution gives $0/0$, so use the standard limit: the value is $1$.',
    variant: 'Find $\\lim_{x \\to 0} \\frac{\\sin x}{x}$.\n\nSubstituting gives $0/0$, which is indeterminate — you cannot stop there.\n\nThe standard limit gives $1$.',
    shouldAgree: true,
  },
  {
    id: 'ok-we-gaussian-elimination',
    atomType: 'worked_example',
    base: 'Solve $\\begin{cases} x + y = 5 \\\\ 2x + 3y = 13 \\end{cases}$. Subtract twice the first row from the second to get $y = 3$, then back-substitute for $x = 2$.',
    variant: 'Solve $\\begin{cases} x + y = 5 \\\\ 2x + 3y = 13 \\end{cases}$.\n\nRow two minus twice row one clears the $x$: that leaves $y = 3$.\n\nPut $y = 3$ back into row one: $x = 2$.',
    shouldAgree: true,
  },
  {
    id: 'ok-we-derivative-chain',
    atomType: 'worked_example',
    base: 'Differentiate $f(x) = \\sin(x^2)$. By the chain rule the outer derivative is $\\cos(x^2)$ and the inner derivative is $2x$, so $f\'(x) = 2x\\cos(x^2)$.',
    variant: 'Differentiate $f(x) = \\sin(x^2)$.\n\nOuter function first: the derivative of $\\sin$ is $\\cos$, evaluated at $x^2$.\n\nThen the inside: the derivative of $x^2$ is $2x$.\n\nMultiply: $f\'(x) = 2x\\cos(x^2)$.',
    shouldAgree: true,
  },
  {
    id: 'ok-we-eigenvector-back-substitute',
    atomType: 'worked_example',
    base: 'With $\\lambda = 5$ for $A = \\begin{pmatrix} 4 & 1 \\\\ 2 & 3 \\end{pmatrix}$, solve $(A - 5I)v = 0$. The rows both reduce to $-x + y = 0$, so any non-zero multiple of $(1,1)$ is an eigenvector.',
    variant: 'Take $\\lambda = 5$ and solve $(A - 5I)v = 0$.\n\nBoth rows collapse to the same equation, $-x + y = 0$.\n\nSo $x = y$, and any non-zero multiple of $(1,1)$ works.',
    shouldAgree: true,
  },
  {
    id: 'ok-we-log-rule',
    atomType: 'worked_example',
    base: 'Simplify $\\log_2 8 + \\log_2 4$. Both arguments are positive, so the sum rule applies: $\\log_2(8 \\times 4) = \\log_2 32 = 5$.',
    variant: 'Simplify $\\log_2 8 + \\log_2 4$.\n\nBoth arguments are positive, so you may combine them: $\\log_2 32$.\n\nThat is $5$.',
    shouldAgree: true,
  },
];

/** Pairs the judge must REJECT. Each breaks one thing, and only that thing. */
const CORRUPTED: EvalPair[] = [
  {
    id: 'bad-dropped-invertibility',
    atomType: 'worked_example',
    base: 'Assuming $\\det A \\neq 0$, the inverse is $A^{-1} = \\frac{1}{\\det A}\\operatorname{adj}A$. For $A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 1 \\end{pmatrix}$ the determinant is $1$, so $A^{-1} = \\begin{pmatrix} 1 & -1 \\\\ -1 & 2 \\end{pmatrix}$.',
    variant: 'The inverse is $A^{-1} = \\frac{1}{\\det A}\\operatorname{adj}A$. For $A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 1 \\end{pmatrix}$ that gives $\\begin{pmatrix} 1 & -1 \\\\ -1 & 2 \\end{pmatrix}$.',
    shouldAgree: false,
    corruption: 'dropped the $\\det A \\neq 0$ condition, so the formula is stated as unconditional',
  },
  {
    id: 'bad-dropped-nonzero',
    atomType: 'worked_example',
    base: 'Project $v = (3,4)$ onto $u = (1,0)$. The formula is $\\frac{v \\cdot u}{u \\cdot u}u$, valid for $u \\neq 0$. Here $v \\cdot u = 3$ and $u \\cdot u = 1$, so the projection is $(3,0)$.',
    variant: 'Project $v = (3,4)$ onto $u = (1,0)$ with $\\frac{v \\cdot u}{u \\cdot u}u$. Here $v \\cdot u = 3$ and $u \\cdot u = 1$, so the projection is $(3,0)$.',
    shouldAgree: false,
    corruption: 'dropped $u \\neq 0$, leaving a formula that divides by zero on the excluded case',
  },
  {
    id: 'bad-dropped-domain',
    atomType: 'worked_example',
    base: 'Evaluate $\\int_1^e \\frac{1}{x}\\,dx$. On $[1,e]$ the integrand is continuous because $x$ never reaches zero, so the fundamental theorem applies: the value is $\\ln e - \\ln 1 = 1$.',
    variant: 'Evaluate $\\int_1^e \\frac{1}{x}\\,dx$. Apply the fundamental theorem: $\\ln e - \\ln 1 = 1$.',
    shouldAgree: false,
    corruption: 'dropped the continuity justification, presenting the fundamental theorem as always applicable to $1/x$',
  },
  {
    id: 'bad-changed-final-answer',
    atomType: 'worked_example',
    base: 'Take $A = \\begin{pmatrix} 4 & 1 \\\\ 2 & 3 \\end{pmatrix}$. Form $A - \\lambda I$, take the determinant, and solve $\\lambda^2 - 7\\lambda + 10 = 0$ to get $\\lambda = 5$ and $\\lambda = 2$.',
    variant: 'Take $A = \\begin{pmatrix} 4 & 1 \\\\ 2 & 3 \\end{pmatrix}$. Subtract $\\lambda$ down the diagonal, take the determinant, solve $\\lambda^2 - 7\\lambda + 10 = 0$. The roots are $\\lambda = 5$ and $\\lambda = 3$.',
    shouldAgree: false,
    corruption: 'changed the second eigenvalue from $2$ to $3$, which is not a root of the stated polynomial',
  },
  {
    id: 'bad-changed-intermediate',
    atomType: 'worked_example',
    base: 'Solve $\\begin{cases} x + y = 5 \\\\ 2x + 3y = 13 \\end{cases}$. Subtract twice the first row from the second to get $y = 3$, then back-substitute for $x = 2$.',
    variant: 'Solve $\\begin{cases} x + y = 5 \\\\ 2x + 3y = 13 \\end{cases}$.\n\nRow two minus twice row one gives $y = 4$.\n\nBack-substitute: $x = 2$.',
    shouldAgree: false,
    corruption: 'changed the intermediate value of $y$ from $3$ to $4$, which no longer satisfies either equation',
  },
  {
    id: 'bad-hook-lost-motivation',
    atomType: 'hook',
    base: 'Two vectors are orthogonal when neither casts any shadow on the other. That independence is what makes an orthogonal basis so cheap to compute with: no component of one direction leaks into another, so projection becomes a single dot product instead of solving a system.',
    variant: 'Two vectors are orthogonal when their dot product is zero. An orthogonal basis is a basis whose vectors are pairwise orthogonal.',
    shouldAgree: false,
    corruption: 'replaced the reason to care — cheap projection, no leakage between directions — with a bare definition',
  },
  {
    id: 'bad-hook-lost-stake',
    atomType: 'hook',
    base: 'The determinant measures how much a linear map inflates or deflates volume. When it is zero the map has flattened space, and flattening cannot be undone — which is precisely why a zero determinant means no inverse.',
    variant: 'The determinant is a number computed from a square matrix. It can be found by cofactor expansion along any row or column.',
    shouldAgree: false,
    corruption: 'dropped the volume meaning and the link to invertibility, leaving a procedure with no motivation',
  },
  {
    id: 'bad-intuition-unbounded-analogy',
    atomType: 'intuition',
    base: 'Think of a linear map as a machine that stretches a rubber sheet. The analogy holds for the geometry but breaks for orientation — a reflection also stretches nothing and still flips the sheet over.',
    variant: 'A linear map is a machine that stretches a rubber sheet. Whatever it does to the sheet, it does the same way everywhere.',
    shouldAgree: false,
    corruption: 'removed the bound the base put on the analogy, so the reflection counterexample is now contradicted',
  },
  {
    id: 'bad-intuition-special-case-as-general',
    atomType: 'intuition',
    base: 'All the eigenvectors for one $\\lambda$, together with zero, form a subspace. Zero has to be included for it to be a subspace at all, even though it is not itself an eigenvector.',
    variant: 'The eigenvectors for a given $\\lambda$ form a subspace, and zero is one of them.',
    shouldAgree: false,
    corruption: 'states zero IS an eigenvector, which the base explicitly denies',
  },
  {
    id: 'bad-intuition-dropped-condition',
    atomType: 'intuition',
    base: 'Projecting $v$ onto $u$ asks: how much of $v$ points along $u$? Drop a perpendicular from the tip of $v$ to the line through $u$; where it lands is the projection. This needs $u \\neq 0$, since a zero vector spans no line to project onto.',
    variant: 'Projection asks how much of $v$ points along $u$. Drop a perpendicular from $v$ to the line through $u$; where it lands is the projection. Any $u$ will do.',
    shouldAgree: false,
    corruption: 'not merely dropped but reversed the $u \\neq 0$ condition into "any $u$ will do"',
  },
];

export const EVAL_PAIRS: EvalPair[] = [...LEGITIMATE, ...CORRUPTED];

export interface EvalResult {
  total: number;
  /** Corrupted pairs correctly rejected / corrupted pairs. */
  recall: number;
  /** Legitimate pairs correctly accepted / legitimate pairs. */
  precision: number;
  /** Pairs the judge got wrong, with which way it went. */
  failures: Array<{ id: string; expected: boolean; got: boolean | 'threw'; corruption?: string }>;
}

/**
 * Recall and precision are reported separately and neither is averaged away.
 *
 * A single accuracy number hides the only failure that matters: a judge that
 * agrees with everything scores 0.75 here, which reads acceptable and means the
 * gate is off. Recall on the corrupted pairs is the number that decides whether
 * this judge may gate anything.
 */
export async function scoreJudge(
  judge: (input: { baseBody: string; variantBody: string; atomType: string }) => Promise<{ agrees: boolean }>,
  pairs: EvalPair[] = EVAL_PAIRS,
): Promise<EvalResult> {
  const failures: EvalResult['failures'] = [];
  let corruptCaught = 0;
  let corruptTotal = 0;
  let legitAccepted = 0;
  let legitTotal = 0;

  for (const p of pairs) {
    if (p.shouldAgree) legitTotal++;
    else corruptTotal++;

    let got: boolean | 'threw';
    try {
      const v = await judge({ baseBody: p.base, variantBody: p.variant, atomType: p.atomType });
      got = v.agrees;
    } catch {
      // A throw is the fail-closed path: the variant is refused. That is the
      // right outcome on a corrupted pair and the wrong one on a legitimate
      // pair, so it is scored as a rejection either way rather than skipped.
      got = 'threw';
    }

    const rejected = got === false || got === 'threw';
    if (p.shouldAgree) {
      if (!rejected) legitAccepted++;
      else failures.push({ id: p.id, expected: true, got });
    } else {
      if (rejected) corruptCaught++;
      else failures.push({ id: p.id, expected: false, got, corruption: p.corruption });
    }
  }

  return {
    total: pairs.length,
    recall: corruptTotal === 0 ? 1 : corruptCaught / corruptTotal,
    precision: legitTotal === 0 ? 1 : legitAccepted / legitTotal,
    failures,
  };
}

/**
 * The bar the judge must clear before it is allowed to gate the corpus.
 *
 * Recall is absolute: ten corruptions, ten of them caught. Every one is a
 * failure a student would read as fact, and a judge that misses one of ten
 * misses roughly fifty-six across 566 variants. Precision is 0.85 because a
 * false rejection costs a human reading one draft, which is recoverable.
 */
export const JUDGE_PROMOTION_BAR = { recall: 1.0, precision: 0.85 } as const;

export function meetsPromotionBar(r: EvalResult): boolean {
  return r.recall >= JUDGE_PROMOTION_BAR.recall && r.precision >= JUDGE_PROMOTION_BAR.precision;
}
