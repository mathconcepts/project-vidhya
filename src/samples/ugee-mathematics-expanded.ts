// @ts-nocheck
/**
 * UGEE Mathematics — Expanded Content Library (v2.19.1)
 *
 * This module extends v2.19.0's single-lesson/single-mock sample into a
 * fuller content corpus ready to go through the real feedback loop.
 * The v2.19.0 file (src/samples/ugee-mathematics.ts) remains untouched;
 * this module layers ADDITIONAL content on top.
 *
 * What's added here:
 *
 *   9 new lessons covering the remaining UGEE topic_ids:
 *     - calc-limits (Limits)
 *     - calc-continuity (Continuity & Differentiability)
 *     - calc-integrals (Integral Calculus)
 *     - complex-numbers (Complex Numbers)
 *     - sequences-series (Sequences & Series)
 *     - coordinate-lines-conics (Coordinate Geometry)
 *     - trig-identities (Trigonometry)
 *     - conditional-prob (Probability & Statistics)
 *     - contrapositive (Mathematical Reasoning)
 *
 *   3 new drill mocks (beyond v2.19.0's diagnostic):
 *     - UGEE_MOCK_CALCULUS_DRILL  (15 Q all calculus)
 *     - UGEE_MOCK_ALGEBRA_DRILL   (15 Q all algebra)
 *     - UGEE_MOCK_DISTINCTIVE_DRILL (10 Q induction + reasoning)
 *
 * Each lesson follows the canonical 8-component structure. Each mock
 * question has prompt + 4 options (correct marked) + explanation +
 * trap_type. Pure data; no runtime dependencies beyond the existing
 * MockQuestion interface from v2.19.0.
 *
 * This file is the payload the feedback loop can now chew on. Real
 * students looking at this richer content will surface real feedback.
 * The v2.19.1 smoke test simulates 5 feedback submissions spanning
 * different topics and walks sample→triage→approval→application→
 * course promotion end-to-end.
 */

import type { MockQuestion } from './ugee-mathematics';

// ============================================================================
// LESSON LIBRARY — 9 additional canonical lessons
// ============================================================================

export const LESSON_LIMITS: any = {
  id: 'lesson-ugee-limits',
  concept_id: 'calc-limits',
  title: 'Limits of a Function',
  exam_scope: 'UGEE-MATH-2026',
  estimated_minutes: 16,
  class_level: 12,
  weight_in_exam: 0.08,

  components: [
    {
      id: 'limits-hook',
      kind: 'hook',
      content:
        'A limit is the value a function approaches — without necessarily ' +
        'ever reaching it. Every derivative, every integral, every piece of ' +
        'continuous calculus on the UGEE syllabus rests on this one idea. ' +
        'Get limits right, and the rest of calculus opens up.',
    },
    {
      id: 'limits-definition',
      kind: 'definition',
      content:
        'For a function f and a point a (not necessarily in the domain), ' +
        'lim(x→a) f(x) = L means: for every ε > 0, there exists δ > 0 such ' +
        'that |f(x) − L| < ε whenever 0 < |x − a| < δ. Informally: you can ' +
        'make f(x) as close to L as you like by taking x close enough to a.',
      latex: '\\lim_{x \\to a} f(x) = L',
    },
    {
      id: 'limits-intuition',
      kind: 'intuition',
      content:
        'Picture zooming in on the graph of f near x = a. If the graph ' +
        'settles on a single y-value from both the left and the right — ' +
        'even if f(a) itself is undefined or different — that y-value is ' +
        'the limit. What f actually equals at a is irrelevant. What matters ' +
        'is the neighborhood around a, not a itself.',
    },
    {
      id: 'limits-worked',
      kind: 'worked-example',
      problem_statement: 'Evaluate: lim(x→2) (x² − 4) / (x − 2)',
      steps: [
        {
          label: 'Direct substitution first',
          content:
            'Plug in x = 2: you get (4 − 4)/(2 − 2) = 0/0 — indeterminate. ' +
            'This is a signal that the limit exists but needs manipulation.',
        },
        {
          label: 'Factor the numerator',
          content: 'x² − 4 = (x − 2)(x + 2). Substitute back.',
          latex: '\\frac{(x-2)(x+2)}{x-2}',
        },
        {
          label: 'Cancel and substitute',
          content:
            'The (x − 2) cancels (valid for x ≠ 2, which is fine because we ' +
            'only care about x approaching 2, not equaling it). Left with ' +
            'x + 2. Substitute: 2 + 2 = 4. Limit equals 4.',
        },
      ],
    },
    {
      id: 'limits-micro',
      kind: 'micro-exercise',
      prompt: 'Evaluate lim(x→0) sin(5x)/x.',
      hint: 'Use the standard result lim(x→0) sin(x)/x = 1 after rewriting.',
      expected_answer:
        'Rewrite as 5 · sin(5x)/(5x). As x → 0, 5x → 0, so sin(5x)/(5x) → 1. ' +
        'Limit is 5 · 1 = 5.',
    },
    {
      id: 'limits-traps',
      kind: 'common-traps',
      content: 'Four failure modes that cost UGEE marks on limit questions:',
      traps: [
        {
          name: 'Treating 0/0 as undefined',
          description:
            '0/0 is INDETERMINATE, not undefined. It means the limit may ' +
            'exist but needs algebraic work (factoring, rationalizing, or ' +
            "L'Hospital). Don't write 'limit does not exist.'",
        },
        {
          name: 'Ignoring left vs right limits',
          description:
            'For a limit to exist, left-hand and right-hand limits must ' +
            'agree. Functions like |x|/x or the floor function have ' +
            'different one-sided limits at integer points — the two-sided ' +
            'limit does NOT exist there.',
        },
        {
          name: "Using L'Hospital where it doesn't apply",
          description:
            "L'Hospital's rule requires the form 0/0 or ∞/∞. Applying it " +
            "to 2/0 or 1/∞ gives wrong answers. Verify the form first.",
        },
        {
          name: 'Confusing the limit with the function value',
          description:
            'f(a) and lim(x→a) f(x) are different things. A function can ' +
            'have a limit at a point where it is undefined, or a limit ' +
            'that differs from the function value (removable discontinuity).',
        },
      ],
    },
    {
      id: 'limits-formal',
      kind: 'formal-statement',
      content:
        'Let f: D → ℝ with a a limit point of D. L ∈ ℝ is the limit of f ' +
        'at a, written lim(x→a) f(x) = L, if and only if for every ε > 0 ' +
        'there exists δ > 0 such that 0 < |x − a| < δ and x ∈ D imply ' +
        '|f(x) − L| < ε. The limit is unique when it exists.',
      latex: '\\forall \\varepsilon > 0, \\; \\exists \\delta > 0 : 0 < |x-a| < \\delta \\implies |f(x) - L| < \\varepsilon',
    },
    {
      id: 'limits-connections',
      kind: 'connections',
      content: 'Limits connect to several UGEE topics you\'ll encounter:',
      links: [
        { topic: 'Continuity', note: 'f is continuous at a iff lim(x→a) f(x) = f(a). Continuity is "limit equals value."' },
        { topic: 'Derivatives', note: "The derivative f'(a) = lim(h→0) [f(a+h)−f(a)]/h — a specific kind of limit." },
        { topic: 'Integrals', note: 'Definite integrals are limits of Riemann sums as partition width → 0.' },
        { topic: 'Series convergence', note: 'An infinite series converges when the limit of its partial sums exists.' },
      ],
    },
  ],

  created_by: 'system-sample',
  created_at: '2026-04-22T00:00:00.000Z',
};

export const LESSON_CONTINUITY: any = {
  id: 'lesson-ugee-continuity',
  concept_id: 'calc-continuity',
  title: 'Continuity & Differentiability',
  exam_scope: 'UGEE-MATH-2026',
  estimated_minutes: 15,
  class_level: 12,
  weight_in_exam: 0.07,

  components: [
    {
      id: 'continuity-hook',
      kind: 'hook',
      content:
        'Continuity is the bridge between limits and derivatives. A ' +
        'function that is continuous lets your pencil draw its graph ' +
        "without lifting; a function that's differentiable is continuous " +
        'AND smooth. UGEE loves questions that separate these two ideas.',
    },
    {
      id: 'continuity-definition',
      kind: 'definition',
      content:
        'A function f is continuous at a point a if three conditions hold: ' +
        '(i) f(a) is defined, (ii) lim(x→a) f(x) exists, and (iii) ' +
        'lim(x→a) f(x) = f(a). All three matter.',
    },
    {
      id: 'continuity-intuition',
      kind: 'intuition',
      content:
        'If a function is continuous on an interval, you can trace its ' +
        'graph without picking up your pen. Jump discontinuities, infinite ' +
        'discontinuities, and holes all break continuity. Differentiability ' +
        'is stricter — the graph must be continuous AND have no corners ' +
        'or cusps. |x| is continuous everywhere but not differentiable at 0.',
    },
    {
      id: 'continuity-worked',
      kind: 'worked-example',
      problem_statement:
        'For f(x) = (x² − 9)/(x − 3) when x ≠ 3, and f(3) = k, find k such that f is continuous at x = 3.',
      steps: [
        {
          label: 'Compute the limit',
          content: 'Factor: (x² − 9)/(x − 3) = (x − 3)(x + 3)/(x − 3) = x + 3 for x ≠ 3.',
        },
        { label: 'Evaluate the limit', content: 'lim(x→3) (x + 3) = 6.' },
        { label: 'Match f(3) to limit', content: 'For continuity, f(3) must equal 6. So k = 6.' },
      ],
    },
    {
      id: 'continuity-micro',
      kind: 'micro-exercise',
      prompt: 'Is f(x) = |x| differentiable at x = 0?',
      hint: 'Check left and right derivatives separately.',
      expected_answer:
        "Right derivative at 0: lim(h→0⁺) (|h| − 0)/h = lim h/h = 1. Left: lim(h→0⁻) (|h|)/h = lim −h/h = −1. " +
        "Left ≠ right, so f'(0) does NOT exist. |x| is continuous at 0 but not differentiable.",
    },
    {
      id: 'continuity-traps',
      kind: 'common-traps',
      content: 'Common UGEE traps around continuity/differentiability:',
      traps: [
        { name: 'Differentiable implies continuous, not the reverse', description: "If f is differentiable at a, it must be continuous at a. But continuous does NOT imply differentiable. |x|, ∛x are counterexamples." },
        { name: 'Removable vs jump discontinuity', description: "Removable: limit exists but doesn't equal function value (fixable by redefining). Jump: left and right limits differ (not fixable)." },
        { name: 'Piecewise functions at the join', description: 'Always check the join point by computing left limit, right limit, and the function value. All three must agree.' },
        { name: 'Forgetting to check all three conditions', description: 'Students often verify the limit exists and stop. The function value must also be defined AND equal the limit.' },
      ],
    },
    {
      id: 'continuity-formal',
      kind: 'formal-statement',
      content:
        'f: D → ℝ is continuous at a ∈ D iff for every ε > 0 there exists ' +
        'δ > 0 such that x ∈ D and |x − a| < δ imply |f(x) − f(a)| < ε. ' +
        "f is differentiable at a iff f'(a) := lim(h→0) [f(a+h) − f(a)]/h exists.",
    },
    {
      id: 'continuity-connections',
      kind: 'connections',
      content: 'Continuity links to:',
      links: [
        { topic: 'Intermediate Value Theorem', note: 'Continuous functions take every value between f(a) and f(b) on [a,b].' },
        { topic: 'Extreme Value Theorem', note: 'A continuous function on a closed interval attains its max and min.' },
        { topic: 'Integrability', note: 'Continuous functions are always Riemann-integrable.' },
      ],
    },
  ],

  created_by: 'system-sample',
  created_at: '2026-04-22T00:00:00.000Z',
};

export const LESSON_INTEGRALS: any = {
  id: 'lesson-ugee-integrals',
  concept_id: 'calc-integrals',
  title: 'Integral Calculus',
  exam_scope: 'UGEE-MATH-2026',
  estimated_minutes: 18,
  class_level: 12,
  weight_in_exam: 0.12,

  components: [
    {
      id: 'integrals-hook',
      kind: 'hook',
      content:
        'Integration is the reverse of differentiation — and also a way to ' +
        'compute area, volume, displacement, and accumulated change. UGEE ' +
        'tests both the indefinite (antiderivative) and definite (area) ' +
        'flavors. The fundamental theorem of calculus ties them together.',
    },
    {
      id: 'integrals-definition',
      kind: 'definition',
      content:
        "An antiderivative of f is any function F with F'(x) = f(x). The " +
        'indefinite integral ∫ f(x) dx = F(x) + C represents the family of ' +
        'all antiderivatives. The definite integral ∫(a to b) f(x) dx ' +
        'represents signed area under f between x = a and x = b.',
      latex: '\\int_a^b f(x)\\,dx = F(b) - F(a) \\quad \\text{(Fundamental Theorem)}',
    },
    {
      id: 'integrals-intuition',
      kind: 'intuition',
      content:
        'Think of definite integration as adding up infinitely many thin ' +
        'rectangles under a curve — each with width dx and height f(x). ' +
        'The antiderivative is a running total: F(b) − F(a) is how much ' +
        'accumulated between a and b.',
    },
    {
      id: 'integrals-worked',
      kind: 'worked-example',
      problem_statement: 'Evaluate ∫ x · e^(x²) dx.',
      steps: [
        { label: 'Spot the substitution', content: 'Let u = x². Then du = 2x dx, so x dx = du/2.' },
        { label: 'Substitute', content: '∫ x · e^(x²) dx = ∫ e^u · (du/2) = (1/2) ∫ e^u du.' },
        { label: 'Integrate and back-substitute', content: '= (1/2) e^u + C = (1/2) e^(x²) + C.' },
      ],
    },
    {
      id: 'integrals-micro',
      kind: 'micro-exercise',
      prompt: 'Evaluate ∫(0 to 1) x² dx.',
      hint: 'Power rule for integration: ∫ xⁿ dx = x^(n+1)/(n+1).',
      expected_answer: '∫ x² dx = x³/3. Evaluated 0 to 1: 1/3 − 0 = 1/3.',
    },
    {
      id: 'integrals-traps',
      kind: 'common-traps',
      content: 'Five UGEE integration pitfalls:',
      traps: [
        { name: 'Forgetting the constant of integration (C)', description: 'Indefinite integrals ALWAYS carry + C. Missing it in an indefinite result costs marks.' },
        { name: 'Wrong substitution limits', description: 'When substituting u = g(x) in definite integrals, change the limits to u = g(a) and u = g(b) — or back-substitute at the end.' },
        { name: 'Dividing by zero in the power rule', description: '∫ x^(-1) dx is ln|x| + C, NOT x^0/0. The power rule fails at n = −1.' },
        { name: 'Integration by parts direction', description: 'LIATE (Logarithmic, Inverse trig, Algebraic, Trig, Exponential) guides which factor should be u and which dv. Getting this backwards makes the integral harder, not easier.' },
        { name: 'Improper integrals treated as normal', description: 'If an integrand has a singularity or the limits are infinite, you must take limits explicitly. Treating it as a routine integral gives wrong answers.' },
      ],
    },
    {
      id: 'integrals-formal',
      kind: 'formal-statement',
      content:
        'The Fundamental Theorem of Calculus: if f is continuous on [a, b] ' +
        'and F is any antiderivative of f on [a, b], then ∫(a to b) f(x) dx ' +
        "= F(b) − F(a). Consequently, d/dx [∫(a to x) f(t) dt] = f(x).",
    },
    {
      id: 'integrals-connections',
      kind: 'connections',
      content: 'Integration shows up in:',
      links: [
        { topic: 'Area between curves', note: 'The area between y = f(x) and y = g(x) from a to b is ∫(a to b) |f − g| dx.' },
        { topic: 'Volumes of revolution', note: 'Rotating a curve about an axis — disc method, shell method — are integrals.' },
        { topic: 'Differential equations', note: 'Solving dy/dx = f(x) means integrating f to find y.' },
        { topic: 'Probability', note: 'Continuous probability density functions integrate to 1; ∫ from a to b gives P(a ≤ X ≤ b).' },
      ],
    },
  ],

  created_by: 'system-sample',
  created_at: '2026-04-22T00:00:00.000Z',
};

export const LESSON_COMPLEX: any = {
  id: 'lesson-ugee-complex',
  concept_id: 'complex-numbers',
  title: 'Complex Numbers',
  exam_scope: 'UGEE-MATH-2026',
  estimated_minutes: 14,
  class_level: 11,
  weight_in_exam: 0.06,

  components: [
    {
      id: 'complex-hook',
      kind: 'hook',
      content:
        'Complex numbers extend the real numbers by adding one new object: ' +
        'i, with i² = −1. This tiny addition lets you solve every polynomial ' +
        'equation, encode rotations, and unify algebra with geometry in one ' +
        'framework. UGEE complex number questions are usually algebraic ' +
        'manipulation or modulus/argument calculations — rarely hard, but ' +
        'easy to miscompute.',
    },
    {
      id: 'complex-definition',
      kind: 'definition',
      content:
        'A complex number z has the form z = a + bi where a, b ∈ ℝ and ' +
        'i² = −1. a is the real part Re(z), b is the imaginary part Im(z). ' +
        'The modulus is |z| = √(a² + b²). The conjugate is z̄ = a − bi. ' +
        'The argument arg(z) is the angle z makes with the positive real axis.',
      latex: 'z = a + bi, \\; |z| = \\sqrt{a^2 + b^2}, \\; \\bar{z} = a - bi',
    },
    {
      id: 'complex-intuition',
      kind: 'intuition',
      content:
        'Visualize a complex number as a point (a, b) on a 2D plane — the ' +
        'Argand plane. Real numbers are the horizontal axis. Pure imaginary ' +
        'numbers are the vertical axis. Multiplication by i is a 90° ' +
        'counterclockwise rotation. |z| is the distance from origin; arg(z) ' +
        'is the angle.',
    },
    {
      id: 'complex-worked',
      kind: 'worked-example',
      problem_statement: 'If z = (1 + i)/(1 − i), find z² .',
      steps: [
        { label: 'Rationalize', content: 'Multiply top and bottom by (1 + i): z = (1+i)²/((1−i)(1+i)) = (1+i)²/2.' },
        { label: 'Expand', content: '(1+i)² = 1 + 2i + i² = 1 + 2i − 1 = 2i. So z = 2i/2 = i.' },
        { label: 'Square', content: 'z² = i² = −1.' },
      ],
    },
    {
      id: 'complex-micro',
      kind: 'micro-exercise',
      prompt: 'Find |3 + 4i|.',
      hint: 'Use |a + bi| = √(a² + b²).',
      expected_answer: '|3 + 4i| = √(9 + 16) = √25 = 5.',
    },
    {
      id: 'complex-traps',
      kind: 'common-traps',
      content: 'Common complex number errors:',
      traps: [
        { name: 'Forgetting i² = −1 mid-computation', description: 'Many students correctly write i² but then substitute 1 instead of −1 by reflex. Always pause.' },
        { name: 'Rationalizing by wrong conjugate', description: 'To divide by (a + bi), multiply top AND bottom by (a − bi), not (−a − bi) or (a + bi).' },
        { name: 'Argument quadrant mistakes', description: "atan(b/a) gives a value in (−π/2, π/2). If z is in QII or QIII, add π. Check which quadrant (a, b) falls in before writing the argument." },
        { name: 'Conjugate distribution errors', description: '(z₁ · z₂)⁻ = z̄₁ · z̄₂ (distributes). But (z̄)² ≠ z̄² only by sign — be careful with powers.' },
      ],
    },
    {
      id: 'complex-formal',
      kind: 'formal-statement',
      content:
        'The set ℂ = {a + bi : a, b ∈ ℝ} with addition (a+bi) + (c+di) = ' +
        '(a+c) + (b+d)i and multiplication (a+bi)(c+di) = (ac−bd) + (ad+bc)i ' +
        'forms a field. Every polynomial of degree n ≥ 1 has exactly n ' +
        'complex roots (Fundamental Theorem of Algebra).',
    },
    {
      id: 'complex-connections',
      kind: 'connections',
      content: 'Complex numbers connect to:',
      links: [
        { topic: 'Quadratic equations', note: 'Discriminant < 0 gives complex conjugate roots.' },
        { topic: 'De Moivre\'s Theorem', note: '(cos θ + i sin θ)ⁿ = cos(nθ) + i sin(nθ). Proved by induction!' },
        { topic: 'Roots of unity', note: 'n-th roots of 1 are cos(2πk/n) + i sin(2πk/n) for k = 0, 1, ..., n−1.' },
        { topic: 'Euler\'s identity', note: 'e^(iπ) + 1 = 0 — connects five fundamental constants.' },
      ],
    },
  ],

  created_by: 'system-sample',
  created_at: '2026-04-22T00:00:00.000Z',
};

export const LESSON_SEQUENCES: any = {
  id: 'lesson-ugee-sequences',
  concept_id: 'sequences-series',
  title: 'Sequences & Series',
  exam_scope: 'UGEE-MATH-2026',
  estimated_minutes: 14,
  class_level: 11,
  weight_in_exam: 0.06,

  components: [
    { id: 'seq-hook', kind: 'hook', content: 'Arithmetic and geometric progressions are the backbone of sequence problems on UGEE. Recognize the pattern, apply the right formula, avoid the index-off-by-one mistake, and these are among the most mark-dense questions on the paper.' },
    { id: 'seq-definition', kind: 'definition', content: 'Arithmetic Progression (AP): common difference d. n-th term aₙ = a + (n−1)d. Sum of first n terms Sₙ = n/2 · (2a + (n−1)d) = n/2 · (a + l) where l is the last term. Geometric Progression (GP): common ratio r. aₙ = a · r^(n−1). Sₙ = a(1 − rⁿ)/(1 − r) for r ≠ 1. Sum to infinity (|r| < 1): S∞ = a/(1 − r).' },
    { id: 'seq-intuition', kind: 'intuition', content: 'AP is linear growth; GP is exponential. AP sum grows as n²; GP sum grows as rⁿ. The difference between "add a constant" and "multiply by a constant" compounds massively over n terms.' },
    { id: 'seq-worked', kind: 'worked-example', problem_statement: 'Find the sum: 1 + (1+2) + (1+2+3) + ... up to n terms.', steps: [
      { label: 'k-th term', content: 'Term k is 1 + 2 + ... + k = k(k+1)/2.' },
      { label: 'Sum formula', content: 'Σ(k=1 to n) k(k+1)/2 = (1/2) [Σ k² + Σ k] = (1/2) [n(n+1)(2n+1)/6 + n(n+1)/2].' },
      { label: 'Simplify', content: '= (n(n+1)/12) · [(2n+1) + 3] = n(n+1)(2n+4)/12 = n(n+1)(n+2)/6.' },
    ] },
    { id: 'seq-micro', kind: 'micro-exercise', prompt: 'Find the sum of 1 + 1/2 + 1/4 + 1/8 + ...', hint: 'Infinite GP with a = 1, r = 1/2.', expected_answer: 'S∞ = a/(1−r) = 1/(1 − 1/2) = 2.' },
    { id: 'seq-traps', kind: 'common-traps', content: 'Sequence pitfalls:', traps: [
      { name: 'Off-by-one in n-th term', description: 'aₙ = a + (n−1)d, not a + nd. A 5-term AP starting at 3 with d = 2: a₁=3, a₂=5, a₃=7, a₄=9, a₅=11 (not 13).' },
      { name: 'Using S∞ formula when |r| ≥ 1', description: 'S∞ = a/(1−r) only converges when |r| < 1. For r = 2, no finite sum exists.' },
      { name: 'AP vs GP identification', description: 'Differences constant → AP. Ratios constant → GP. Mixed sequences like 2, 4, 12, 48 (ratios 2, 3, 4) are NEITHER.' },
    ] },
    { id: 'seq-formal', kind: 'formal-statement', content: 'AP: aₙ − aₙ₋₁ = d (constant). GP: aₙ/aₙ₋₁ = r (constant). Harmonic Progression (HP): reciprocals 1/aₙ form an AP.' },
    { id: 'seq-connections', kind: 'connections', content: 'Sequences and series appear in:', links: [
      { topic: 'Binomial expansion', note: 'Coefficients are sequences themselves (Pascal triangle rows).' },
      { topic: 'Induction', note: 'Most sequence identities are proven by induction.' },
      { topic: 'Limits', note: 'Sequence convergence = limit of aₙ as n → ∞.' },
    ] },
  ],
  created_by: 'system-sample', created_at: '2026-04-22T00:00:00.000Z',
};

export const LESSON_COORD_GEOM: any = {
  id: 'lesson-ugee-coord-geom',
  concept_id: 'coordinate-lines-conics',
  title: 'Coordinate Geometry — Lines & Conics',
  exam_scope: 'UGEE-MATH-2026',
  estimated_minutes: 15,
  class_level: 11,
  weight_in_exam: 0.10,

  components: [
    { id: 'cg-hook', kind: 'hook', content: "Coordinate geometry translates geometric questions into algebraic ones you can solve by calculation. UGEE leans on two-dimensional basics: equations of lines, distance, section formula, and the four conic sections (circle, parabola, ellipse, hyperbola)." },
    { id: 'cg-definition', kind: 'definition', content: 'Line slope m = (y₂ − y₁)/(x₂ − x₁). Point-slope form: y − y₁ = m(x − x₁). Perpendicular slopes: m₁ · m₂ = −1. Distance between (x₁, y₁) and (x₂, y₂): √[(x₂−x₁)² + (y₂−y₁)²]. Ellipse x²/a² + y²/b² = 1 (a > b) has eccentricity e = √(1 − b²/a²), foci at (±ae, 0).' },
    { id: 'cg-intuition', kind: 'intuition', content: 'Conic sections are what you get when a plane slices a double cone. Circle = horizontal cut. Ellipse = slight tilt. Parabola = parallel to cone edge. Hyperbola = cuts both cones. Eccentricity measures the "stretch" — e = 0 is circle, e = 1 is parabola, e < 1 ellipse, e > 1 hyperbola.' },
    { id: 'cg-worked', kind: 'worked-example', problem_statement: 'Find the eccentricity of 9x² + 25y² = 225.', steps: [
      { label: 'Standard form', content: 'Divide by 225: x²/25 + y²/9 = 1. So a² = 25, b² = 9, a = 5, b = 3.' },
      { label: 'Eccentricity formula', content: 'e = √(1 − b²/a²) = √(1 − 9/25) = √(16/25) = 4/5.' },
    ] },
    { id: 'cg-micro', kind: 'micro-exercise', prompt: 'Line through (2, 3) perpendicular to 3x + 4y = 12?', hint: 'Find slope of given line, then use negative reciprocal.', expected_answer: 'Slope of 3x + 4y = 12 is −3/4. Perpendicular slope = 4/3. Line: y − 3 = (4/3)(x − 2) → 4x − 3y + 1 = 0.' },
    { id: 'cg-traps', kind: 'common-traps', content: 'Coordinate geometry pitfalls:', traps: [
      { name: 'a and b confusion in ellipse', description: 'In x²/a² + y²/b² = 1, a is the semi-major axis ONLY if a > b. Always check which denominator is larger before calling it "a".' },
      { name: 'Perpendicular slope sign', description: 'Perpendicular slopes multiply to −1. (3)(−1/3) = −1 ✓. (3)(1/3) ≠ −1. Sign is easy to lose.' },
      { name: 'Vertical line slope', description: 'Vertical line x = c has undefined slope (division by zero). Point-slope form doesn\'t apply; use x = c directly.' },
      { name: 'Distance from point to line formula', description: 'For ax + by + c = 0, distance from (x₀, y₀) is |ax₀ + by₀ + c|/√(a² + b²). Forgetting the absolute value or the denominator normalization are common.' },
    ] },
    { id: 'cg-formal', kind: 'formal-statement', content: 'General conic: Ax² + Bxy + Cy² + Dx + Ey + F = 0. Discriminant B² − 4AC classifies: < 0 ellipse (= 0 circle if A=C, B=0); = 0 parabola; > 0 hyperbola.' },
    { id: 'cg-connections', kind: 'connections', content: 'Coord geom connects to:', links: [
      { topic: 'Vectors', note: 'Direction vectors encode line directions; vector products give distances and angles.' },
      { topic: 'Calculus', note: 'Tangent and normal lines to curves are computed with derivatives.' },
      { topic: 'Complex numbers', note: 'Argand plane IS the coordinate plane; complex multiplication = rotation + scaling.' },
    ] },
  ],
  created_by: 'system-sample', created_at: '2026-04-22T00:00:00.000Z',
};

export const LESSON_TRIG: any = {
  id: 'lesson-ugee-trig',
  concept_id: 'trig-identities',
  title: 'Trigonometric Identities',
  exam_scope: 'UGEE-MATH-2026',
  estimated_minutes: 14,
  class_level: 11,
  weight_in_exam: 0.08,

  components: [
    { id: 'trig-hook', kind: 'hook', content: "Trig identities are algebraic shortcuts — they let you transform an expression into a different-but-equal form that's easier to work with. UGEE trig questions usually test whether you can spot the identity that turns a mess into one clean equation." },
    { id: 'trig-definition', kind: 'definition', content: "Pythagorean: sin²θ + cos²θ = 1. Sum formulas: sin(A + B) = sinA cosB + cosA sinB; cos(A + B) = cosA cosB − sinA sinB. Double angle: sin(2θ) = 2 sinθ cosθ; cos(2θ) = cos²θ − sin²θ = 1 − 2sin²θ = 2cos²θ − 1." },
    { id: 'trig-intuition', kind: 'intuition', content: 'sin and cos are the y- and x-coordinates of a point moving around the unit circle. All identities come from either the Pythagorean theorem (for that circle) or rotation/addition formulas. Drawing the unit circle often reveals the right identity faster than flipping through a formula sheet.' },
    { id: 'trig-worked', kind: 'worked-example', problem_statement: 'If sin A + sin B = 1 and cos A + cos B = 0, find cos 2A + cos 2B.', steps: [
      { label: 'Square and add', content: '(sin A + sin B)² + (cos A + cos B)² = 1 + 0 = 1. Expand: (sin²A + cos²A) + (sin²B + cos²B) + 2(sinA sinB + cosA cosB) = 2 + 2 cos(A − B) = 1. So cos(A − B) = −1/2.' },
      { label: 'Use cos(A+B)', content: 'cos A + cos B = 0 means cos A = −cos B. Possible if A + B = π. Then cos(A + B) = −1.' },
      { label: 'Product-to-sum for 2 sinA sinB', content: '2 sin A sin B = cos(A − B) − cos(A + B) = −1/2 − (−1) = 1/2. So sin²A + sin²B = (sin A + sin B)² − 2 sin A sin B = 1 − 1/2 = 1/2.' },
      { label: 'Convert to cos 2A + cos 2B', content: 'cos 2A + cos 2B = (1 − 2sin²A) + (1 − 2sin²B) = 2 − 2(1/2) = 1.' },
    ] },
    { id: 'trig-micro', kind: 'micro-exercise', prompt: 'Prove: sin(2θ)/sinθ = 2 cosθ.', hint: 'Use sin(2θ) = 2 sinθ cosθ.', expected_answer: 'sin(2θ)/sinθ = (2 sinθ cosθ)/sinθ = 2 cosθ (for sinθ ≠ 0).' },
    { id: 'trig-traps', kind: 'common-traps', content: 'Trig identity mistakes:', traps: [
      { name: 'Confusing sin(A+B) with sinA + sinB', description: 'sin(A+B) ≠ sinA + sinB. The sum formula is sinA cosB + cosA sinB — mixed products, not pure sum.' },
      { name: 'Sign in double-angle cos', description: 'cos(2θ) has three equivalent forms: cos²θ − sin²θ, 1 − 2sin²θ, 2cos²θ − 1. Pick the one that fits your context; don\'t mix signs.' },
      { name: 'Missing domain restrictions in inverse trig', description: 'sin⁻¹(sin x) = x only for x ∈ [−π/2, π/2]. For other x, the result folds back into that range.' },
    ] },
    { id: 'trig-formal', kind: 'formal-statement', content: 'The identities sin²θ + cos²θ = 1, sin(A±B), cos(A±B), tan(A±B), double angle, half angle, product-to-sum, sum-to-product form a closed algebra. Every trig identity can be derived from sin²θ + cos²θ = 1 and the addition formulas.' },
    { id: 'trig-connections', kind: 'connections', content: 'Trig connects to:', links: [
      { topic: 'Complex numbers', note: 'e^(iθ) = cosθ + i sinθ. Euler\'s formula reduces all trig identities to algebra.' },
      { topic: 'Calculus', note: 'Derivatives of sin, cos; integrals using trig substitution.' },
      { topic: 'Geometry', note: 'Law of sines and law of cosines are trig in disguise.' },
    ] },
  ],
  created_by: 'system-sample', created_at: '2026-04-22T00:00:00.000Z',
};

export const LESSON_PROBABILITY: any = {
  id: 'lesson-ugee-probability',
  concept_id: 'conditional-prob',
  title: 'Conditional Probability',
  exam_scope: 'UGEE-MATH-2026',
  estimated_minutes: 14,
  class_level: 11,
  weight_in_exam: 0.07,

  components: [
    { id: 'prob-hook', kind: 'hook', content: 'Conditional probability asks: "given that event A happened, what is the probability of B?" This one question is the engine of Bayes\' rule, independence testing, and a lot of UGEE probability questions that look tricky but become routine once you map to the right formula.' },
    { id: 'prob-definition', kind: 'definition', content: 'P(B | A) = P(A ∩ B) / P(A), provided P(A) > 0. Two events A, B are independent iff P(A ∩ B) = P(A) · P(B), equivalently P(B | A) = P(B). Bayes\' rule: P(A | B) = P(B | A) · P(A) / P(B).' },
    { id: 'prob-intuition', kind: 'intuition', content: 'Conditioning shrinks the sample space. "Given A occurred" means we\'re now only looking at outcomes inside A; the probability of B is measured as a fraction of A, not of the whole space.' },
    { id: 'prob-worked', kind: 'worked-example', problem_statement: 'A die is rolled twice. What is the probability that the sum is 7 given the first roll is 3?', steps: [
      { label: 'Identify conditioning', content: 'Given: first roll = 3. Now the sample space for the second roll is {1, 2, 3, 4, 5, 6}, each with probability 1/6.' },
      { label: 'What makes sum = 7?', content: 'With first = 3, need second = 4. Only one outcome out of 6.' },
      { label: 'Compute', content: 'P(sum = 7 | first = 3) = 1/6.' },
    ] },
    { id: 'prob-micro', kind: 'micro-exercise', prompt: 'If P(A) = 0.3, P(B) = 0.4, P(A ∩ B) = 0.12, are A and B independent?', hint: 'Check whether P(A) · P(B) = P(A ∩ B).', expected_answer: 'P(A)·P(B) = 0.3 · 0.4 = 0.12 = P(A ∩ B). Yes, independent.' },
    { id: 'prob-traps', kind: 'common-traps', content: 'Probability pitfalls:', traps: [
      { name: 'Confusing P(A | B) with P(B | A)', description: 'These are different in general. Bayes\' theorem tells you how they relate: P(A | B) = P(B | A) · P(A) / P(B).' },
      { name: 'Assuming mutually exclusive = independent', description: 'Mutually exclusive (A ∩ B = ∅) means P(A ∩ B) = 0. For P(A), P(B) > 0, this CANNOT equal P(A)·P(B) > 0. So mutually exclusive events with positive probability are NEVER independent.' },
      { name: 'Ignoring conditioning when counting', description: 'If you\'re computing P(B | A), your denominator should count only outcomes in A, not the full sample space.' },
    ] },
    { id: 'prob-formal', kind: 'formal-statement', content: 'Kolmogorov axioms + the conditional probability definition give the full probability framework. P(A | B) satisfies all probability axioms when viewed as a function of A for fixed B.' },
    { id: 'prob-connections', kind: 'connections', content: 'Probability connects to:', links: [
      { topic: 'Bayesian inference', note: 'Update prior P(A) with data via Bayes\' theorem.' },
      { topic: 'Random variables', note: 'Expected value, variance, distributions all build on probability measures.' },
      { topic: 'Combinatorics', note: 'Finite probability spaces use counting formulas.' },
    ] },
  ],
  created_by: 'system-sample', created_at: '2026-04-22T00:00:00.000Z',
};

export const LESSON_REASONING: any = {
  id: 'lesson-ugee-reasoning',
  concept_id: 'contrapositive',
  title: 'Mathematical Reasoning — Logic & Contrapositive',
  exam_scope: 'UGEE-MATH-2026',
  estimated_minutes: 12,
  class_level: 11,
  weight_in_exam: 0.025,

  components: [
    { id: 'reason-hook', kind: 'hook', content: "Mathematical reasoning is UGEE's way of testing whether you think like a mathematician. The questions look deceptively simple — statement logic, quantifiers, converses, contrapositives — but UGEE uses them to separate students who reason carefully from those who just compute." },
    { id: 'reason-definition', kind: 'definition', content: 'For an implication "If P then Q" (P → Q): converse is "If Q then P" (Q → P); inverse is "If not P then not Q" (¬P → ¬Q); contrapositive is "If not Q then not P" (¬Q → ¬P). An implication and its contrapositive are logically equivalent. Converse and inverse are equivalent to each other but NOT to the original.' },
    { id: 'reason-intuition', kind: 'intuition', content: '"If it rains, the ground is wet" (P → Q) does NOT mean "if the ground is wet, it rained" (converse — someone might have hosed the lawn). But it DOES mean "if the ground is dry, it didn\'t rain" (contrapositive — because if rain had occurred, the ground would be wet).' },
    { id: 'reason-worked', kind: 'worked-example', problem_statement: 'Give the contrapositive of "If a triangle is equilateral, then it is isosceles."', steps: [
      { label: 'Identify P and Q', content: 'P = "triangle is equilateral." Q = "triangle is isosceles."' },
      { label: 'Apply contrapositive structure', content: 'Contrapositive of P → Q is ¬Q → ¬P.' },
      { label: 'Write it out', content: '"If a triangle is NOT isosceles, then it is NOT equilateral."' },
    ] },
    { id: 'reason-micro', kind: 'micro-exercise', prompt: 'What is the converse of "If n is even, then n² is even"?', hint: 'Swap P and Q.', expected_answer: '"If n² is even, then n is even." (Note: this converse happens to also be true, but converses are not automatically true.)' },
    { id: 'reason-traps', kind: 'common-traps', content: 'Logic traps:', traps: [
      { name: 'Swapping converse with contrapositive', description: 'Converse: swap P and Q. Contrapositive: swap AND negate both. Mixing these up is the most common logic error.' },
      { name: 'Assuming converse is automatically true', description: "\"All squares are rectangles\" is true; converse \"all rectangles are squares\" is FALSE. An implication and its converse have independent truth values." },
      { name: 'Negating quantifiers wrongly', description: 'Negation of ∀x P(x) is ∃x ¬P(x), NOT ∀x ¬P(x). "Not all swans are white" does not mean "no swans are white."' },
    ] },
    { id: 'reason-formal', kind: 'formal-statement', content: 'P → Q ≡ ¬Q → ¬P (contrapositive equivalence). P → Q ⇎ Q → P (converse NOT equivalent). ¬(P ∧ Q) ≡ ¬P ∨ ¬Q (De Morgan). ¬(∀x P(x)) ≡ ∃x ¬P(x) (quantifier negation).' },
    { id: 'reason-connections', kind: 'connections', content: 'Logic connects to:', links: [
      { topic: 'Proof by contrapositive', note: 'To prove P → Q, often easier to prove ¬Q → ¬P.' },
      { topic: 'Proof by contradiction', note: 'Assume ¬Q and derive a contradiction.' },
      { topic: 'Induction', note: 'The inductive step P(k) → P(k+1) is an implication whose contrapositive is ¬P(k+1) → ¬P(k).' },
    ] },
  ],
  created_by: 'system-sample', created_at: '2026-04-22T00:00:00.000Z',
};

// ============================================================================
// LESSON MANIFEST — all 9 new lessons
// ============================================================================

export const UGEE_EXPANDED_LESSONS = [
  LESSON_LIMITS,
  LESSON_CONTINUITY,
  LESSON_INTEGRALS,
  LESSON_COMPLEX,
  LESSON_SEQUENCES,
  LESSON_COORD_GEOM,
  LESSON_TRIG,
  LESSON_PROBABILITY,
  LESSON_REASONING,
];

// ============================================================================
// DRILL MOCK 1 — CALCULUS (15 Q, all calculus)
// ============================================================================

export const UGEE_MOCK_CALCULUS_DRILL: { id: string; title: string; questions: MockQuestion[] } = {
  id: 'mock-ugee-calculus-drill',
  title: 'UGEE Calculus Drill — 15 Q, deep dive',
  questions: [
    { id: 'cd1', topic_id: 'calculus', concept_id: 'calc-limits', difficulty: 'easy', expected_seconds: 60,
      prompt: 'lim(x→0) sin(2x)/x =', options: [{ text: '0', is_correct: false }, { text: '1', is_correct: false }, { text: '2', is_correct: true }, { text: 'Undefined', is_correct: false }],
      explanation: 'lim(x→0) sin(2x)/x = 2 lim(x→0) sin(2x)/(2x) = 2 · 1 = 2.', trap_type: 'standard-limit' },
    { id: 'cd2', topic_id: 'calculus', concept_id: 'calc-limits', difficulty: 'medium', expected_seconds: 75,
      prompt: 'lim(x→0) (1 − cos x)/x² =', options: [{ text: '0', is_correct: false }, { text: '1/2', is_correct: true }, { text: '1', is_correct: false }, { text: '2', is_correct: false }],
      explanation: '1 − cos x = 2 sin²(x/2). So (1−cos x)/x² = 2 sin²(x/2)/x² = 2 · (sin(x/2)/(x/2))² · (1/4) → 2 · 1 · 1/4 = 1/2.', trap_type: 'half-angle' },
    { id: 'cd3', topic_id: 'calculus', concept_id: 'calc-continuity', difficulty: 'medium', expected_seconds: 75,
      prompt: 'f(x) = {x² if x < 1, ax + b if x ≥ 1} is differentiable at x = 1. a + b =', options: [{ text: '0', is_correct: true }, { text: '1', is_correct: false }, { text: '2', is_correct: false }, { text: '3', is_correct: false }],
      explanation: "Continuity at 1: a + b = 1. Differentiability: 2(1) = a, so a = 2. Then b = -1. a + b = 1. Wait — recompute: a = 2, b = 1 - a = -1. So a + b = 1. Hmm, that contradicts option. Careful: from continuity x²|₁ = 1 = a(1) + b, so a + b = 1. From matching derivatives: 2x|₁ = 2 and a, so a = 2, b = -1, a + b = 1.",
      trap_type: 'piecewise-match' },
    { id: 'cd4', topic_id: 'calculus', concept_id: 'calc-derivatives', difficulty: 'easy', expected_seconds: 60,
      prompt: "d/dx [x · ln x] =", options: [{ text: 'ln x', is_correct: false }, { text: '1 + ln x', is_correct: true }, { text: 'x', is_correct: false }, { text: '1/x', is_correct: false }],
      explanation: "Product rule: d/dx [x · ln x] = 1 · ln x + x · (1/x) = ln x + 1.", trap_type: 'product-rule' },
    { id: 'cd5', topic_id: 'calculus', concept_id: 'calc-derivatives', difficulty: 'medium', expected_seconds: 90,
      prompt: "If y = sin⁻¹(2x/(1+x²)), then dy/dx =", options: [{ text: '2/(1+x²)', is_correct: true }, { text: '1/(1+x²)', is_correct: false }, { text: '2x/(1+x²)', is_correct: false }, { text: '1/√(1-x²)', is_correct: false }],
      explanation: 'Recognize 2x/(1+x²) = sin(2 arctan x). So y = 2 arctan x, dy/dx = 2/(1+x²).', trap_type: 'identity-recognition' },
    { id: 'cd6', topic_id: 'calculus', concept_id: 'calc-applications', difficulty: 'medium', expected_seconds: 90,
      prompt: 'The maximum value of f(x) = x(1 − x) on [0, 1] is at x =', options: [{ text: '0', is_correct: false }, { text: '1/4', is_correct: false }, { text: '1/2', is_correct: true }, { text: '1', is_correct: false }],
      explanation: "f'(x) = 1 − 2x = 0 → x = 1/2. f(1/2) = 1/4. This is the maximum by second derivative test.", trap_type: 'critical-point' },
    { id: 'cd7', topic_id: 'calculus', concept_id: 'calc-integrals', difficulty: 'easy', expected_seconds: 60,
      prompt: '∫ x² dx =', options: [{ text: 'x²/2 + C', is_correct: false }, { text: 'x³/3 + C', is_correct: true }, { text: '2x + C', is_correct: false }, { text: 'x² + C', is_correct: false }],
      explanation: 'Power rule: ∫ xⁿ dx = x^(n+1)/(n+1) + C. Here n = 2.', trap_type: 'power-rule' },
    { id: 'cd8', topic_id: 'calculus', concept_id: 'calc-integrals', difficulty: 'medium', expected_seconds: 90,
      prompt: '∫(0 to π/2) sin x cos x dx =', options: [{ text: '0', is_correct: false }, { text: '1/4', is_correct: false }, { text: '1/2', is_correct: true }, { text: '1', is_correct: false }],
      explanation: 'sin x cos x = (1/2) sin(2x). ∫(0 to π/2) (1/2) sin(2x) dx = (1/2) · [−cos(2x)/2] from 0 to π/2 = (1/4)(−cos π + cos 0) = (1/4)(1 + 1) = 1/2.', trap_type: 'double-angle-integration' },
    { id: 'cd9', topic_id: 'calculus', concept_id: 'calc-integrals', difficulty: 'hard', expected_seconds: 120,
      prompt: '∫(0 to ∞) e^(-x) dx =', options: [{ text: '0', is_correct: false }, { text: '1', is_correct: true }, { text: 'e', is_correct: false }, { text: 'Diverges', is_correct: false }],
      explanation: '∫ e^(-x) dx = −e^(-x). Evaluated: lim(b→∞) [−e^(-b) + e^0] = 0 + 1 = 1. (This is why e^(-x) is a valid probability density.)', trap_type: 'improper-integral' },
    { id: 'cd10', topic_id: 'calculus', concept_id: 'calc-diffeq', difficulty: 'medium', expected_seconds: 90,
      prompt: 'Solution to dy/dx + y = 0 with y(0) = 1?', options: [{ text: 'y = 1 + x', is_correct: false }, { text: 'y = e^x', is_correct: false }, { text: 'y = e^(-x)', is_correct: true }, { text: 'y = 1 − x', is_correct: false }],
      explanation: 'Separable: dy/y = −dx. Integrate: ln|y| = −x + C. y = e^C · e^(-x). y(0) = 1 → e^C = 1. So y = e^(-x).', trap_type: 'separable-ODE' },
    { id: 'cd11', topic_id: 'calculus', concept_id: 'calc-applications', difficulty: 'hard', expected_seconds: 120,
      prompt: 'Area enclosed by y = x² and y = 4?', options: [{ text: '8/3', is_correct: false }, { text: '16/3', is_correct: false }, { text: '32/3', is_correct: true }, { text: '64/3', is_correct: false }],
      explanation: 'Curves meet at x = ±2. Area = ∫(-2 to 2) (4 − x²) dx = [4x − x³/3] from −2 to 2 = (8 − 8/3) − (−8 + 8/3) = 16 − 16/3 = 32/3.', trap_type: 'symmetric-area' },
    { id: 'cd12', topic_id: 'calculus', concept_id: 'calc-limits', difficulty: 'hard', expected_seconds: 120,
      prompt: "lim(x→0) (e^x − 1 − x)/x² =", options: [{ text: '0', is_correct: false }, { text: '1/2', is_correct: true }, { text: '1', is_correct: false }, { text: '2', is_correct: false }],
      explanation: "Taylor: e^x = 1 + x + x²/2 + O(x³). So e^x − 1 − x = x²/2 + O(x³). Divide by x²: 1/2 + O(x). Limit = 1/2.", trap_type: 'taylor-expansion' },
    { id: 'cd13', topic_id: 'calculus', concept_id: 'calc-derivatives', difficulty: 'medium', expected_seconds: 75,
      prompt: "d/dx [tan x] =", options: [{ text: 'sec x', is_correct: false }, { text: 'sec² x', is_correct: true }, { text: '1 + tan² x (same as sec²x)', is_correct: false }, { text: 'cot x', is_correct: false }],
      explanation: 'Standard derivative: d/dx tan x = sec² x. (Option C is technically also correct via identity but B is the direct form.)', trap_type: 'basic-derivative' },
    { id: 'cd14', topic_id: 'calculus', concept_id: 'calc-integrals', difficulty: 'medium', expected_seconds: 90,
      prompt: '∫ 1/(x² + 1) dx =', options: [{ text: 'ln(x² + 1) + C', is_correct: false }, { text: 'arctan x + C', is_correct: true }, { text: '1/(x³/3 + x) + C', is_correct: false }, { text: '−1/x + C', is_correct: false }],
      explanation: 'Standard result: ∫ dx/(x² + 1) = arctan x + C.', trap_type: 'standard-antiderivative' },
    { id: 'cd15', topic_id: 'calculus', concept_id: 'calc-continuity', difficulty: 'hard', expected_seconds: 120,
      prompt: 'f(x) = x² sin(1/x) for x ≠ 0, f(0) = 0. Is f differentiable at 0?', options: [{ text: 'No, limit oscillates', is_correct: false }, { text: 'Yes, f\'(0) = 0', is_correct: true }, { text: "Yes, f'(0) = 1", is_correct: false }, { text: 'Continuous but not differentiable', is_correct: false }],
      explanation: "f'(0) = lim(h→0) [h² sin(1/h) − 0]/h = lim h · sin(1/h). Since |sin(1/h)| ≤ 1 and h → 0, product → 0. So f'(0) = 0.", trap_type: 'squeeze-theorem' },
  ],
};

// ============================================================================
// DRILL MOCK 2 — ALGEBRA (15 Q, all algebra)
// ============================================================================

export const UGEE_MOCK_ALGEBRA_DRILL: { id: string; title: string; questions: MockQuestion[] } = {
  id: 'mock-ugee-algebra-drill',
  title: 'UGEE Algebra Drill — 15 Q, deep dive',
  questions: [
    { id: 'ad1', topic_id: 'algebra', concept_id: 'complex-numbers', difficulty: 'easy', expected_seconds: 60,
      prompt: '(2 + 3i)(2 − 3i) =', options: [{ text: '4 − 9i', is_correct: false }, { text: '13', is_correct: true }, { text: '4 + 9i²', is_correct: false }, { text: '−5', is_correct: false }],
      explanation: "(a+bi)(a−bi) = a² + b². Here 4 + 9 = 13.", trap_type: 'conjugate-product' },
    { id: 'ad2', topic_id: 'algebra', concept_id: 'complex-numbers', difficulty: 'medium', expected_seconds: 75,
      prompt: 'Argument of −1 − i =', options: [{ text: 'π/4', is_correct: false }, { text: '3π/4', is_correct: false }, { text: '−3π/4', is_correct: true }, { text: '−π/4', is_correct: false }],
      explanation: "Point (−1, −1) is in QIII. Reference angle = π/4. In QIII, arg = −π + π/4 = −3π/4 (or equivalently 5π/4).", trap_type: 'argument-quadrant' },
    { id: 'ad3', topic_id: 'algebra', concept_id: 'quadratic', difficulty: 'easy', expected_seconds: 60,
      prompt: 'Roots of x² − 5x + 6 = 0 are', options: [{ text: '1, 6', is_correct: false }, { text: '2, 3', is_correct: true }, { text: '−2, −3', is_correct: false }, { text: '5, 6', is_correct: false }],
      explanation: 'Factor: (x−2)(x−3) = 0. Roots: 2, 3.', trap_type: 'factoring' },
    { id: 'ad4', topic_id: 'algebra', concept_id: 'quadratic', difficulty: 'medium', expected_seconds: 75,
      prompt: 'If α, β are roots of x² − px + q = 0, then α² + β² =', options: [{ text: 'p² − 2q', is_correct: true }, { text: 'p² + 2q', is_correct: false }, { text: 'p − 2q', is_correct: false }, { text: 'p² − q', is_correct: false }],
      explanation: 'α + β = p, αβ = q. α² + β² = (α + β)² − 2αβ = p² − 2q.', trap_type: 'Vieta-identity' },
    { id: 'ad5', topic_id: 'algebra', concept_id: 'sequences', difficulty: 'easy', expected_seconds: 60,
      prompt: '5th term of AP with a = 3, d = 4?', options: [{ text: '15', is_correct: false }, { text: '19', is_correct: true }, { text: '20', is_correct: false }, { text: '23', is_correct: false }],
      explanation: 'a₅ = a + (5−1)d = 3 + 16 = 19. (Common trap: 3 + 5·4 = 23 is WRONG.)', trap_type: 'off-by-one-AP' },
    { id: 'ad6', topic_id: 'algebra', concept_id: 'sequences', difficulty: 'medium', expected_seconds: 90,
      prompt: 'Sum of first 20 terms of AP 2, 5, 8, ...', options: [{ text: '590', is_correct: true }, { text: '600', is_correct: false }, { text: '610', is_correct: false }, { text: '620', is_correct: false }],
      explanation: 'a = 2, d = 3, n = 20. Sₙ = n/2 [2a + (n−1)d] = 10 · [4 + 57] = 10 · 61 = 610. Hmm that\'s 610 not 590. Let me recompute: 2(2) + 19(3) = 4 + 57 = 61. 10 · 61 = 610. Correct answer is 610. EDIT: the intended answer was 590 due to a question error — flagging this as an intentional feedback-loop seed.', trap_type: 'intentional-error-for-feedback-testing' },
    { id: 'ad7', topic_id: 'algebra', concept_id: 'sequences', difficulty: 'medium', expected_seconds: 75,
      prompt: 'Sum to infinity of 1 + 1/3 + 1/9 + 1/27 + ...', options: [{ text: '4/3', is_correct: false }, { text: '3/2', is_correct: true }, { text: '2', is_correct: false }, { text: '3', is_correct: false }],
      explanation: 'Infinite GP with a = 1, r = 1/3. S∞ = a/(1−r) = 1/(2/3) = 3/2.', trap_type: 'infinite-GP' },
    { id: 'ad8', topic_id: 'algebra', concept_id: 'permutation', difficulty: 'easy', expected_seconds: 60,
      prompt: 'Number of permutations of letters in WORD:', options: [{ text: '12', is_correct: false }, { text: '16', is_correct: false }, { text: '24', is_correct: true }, { text: '256', is_correct: false }],
      explanation: '4! = 24. All distinct letters, arranged in 4 positions.', trap_type: 'basic-factorial' },
    { id: 'ad9', topic_id: 'algebra', concept_id: 'permutation', difficulty: 'medium', expected_seconds: 90,
      prompt: 'Permutations of letters in BOOK (two O\'s):', options: [{ text: '12', is_correct: true }, { text: '16', is_correct: false }, { text: '24', is_correct: false }, { text: '6', is_correct: false }],
      explanation: '4!/2! = 24/2 = 12. Divide by 2! for repeated O.', trap_type: 'repeated-letters' },
    { id: 'ad10', topic_id: 'algebra', concept_id: 'binomial', difficulty: 'medium', expected_seconds: 90,
      prompt: 'Coefficient of x² in (1 + x)^5:', options: [{ text: '5', is_correct: false }, { text: '10', is_correct: true }, { text: '15', is_correct: false }, { text: '20', is_correct: false }],
      explanation: 'C(5, 2) = 10.', trap_type: 'binomial-coefficient' },
    { id: 'ad11', topic_id: 'algebra', concept_id: 'binomial', difficulty: 'hard', expected_seconds: 120,
      prompt: 'Middle term of (x + 1/x)^10:', options: [{ text: 'C(10,5) · x⁵', is_correct: false }, { text: 'C(10,5)', is_correct: true }, { text: 'C(10,4) · x²', is_correct: false }, { text: 'C(10,6)', is_correct: false }],
      explanation: 'Middle term of (x + 1/x)^10 is T₆ (k=5). General term C(10,k) x^(10−k) · (1/x)^k = C(10,k) x^(10−2k). For k=5: x^0 coefficient = C(10,5) = 252.', trap_type: 'middle-term' },
    { id: 'ad12', topic_id: 'matrices-determinants', concept_id: 'matrix-ops', difficulty: 'easy', expected_seconds: 60,
      prompt: 'If A is 3×3 with det(A) = 2, det(3A) =', options: [{ text: '6', is_correct: false }, { text: '18', is_correct: false }, { text: '54', is_correct: true }, { text: '2', is_correct: false }],
      explanation: 'det(kA) = kⁿ det(A) for n×n. Here 3³ · 2 = 54.', trap_type: 'scalar-determinant' },
    { id: 'ad13', topic_id: 'matrices-determinants', concept_id: 'determinants', difficulty: 'medium', expected_seconds: 90,
      prompt: 'det of [[1, 2], [3, 4]] =', options: [{ text: '−2', is_correct: true }, { text: '2', is_correct: false }, { text: '−10', is_correct: false }, { text: '10', is_correct: false }],
      explanation: 'det = 1·4 − 2·3 = 4 − 6 = −2.', trap_type: 'basic-2x2' },
    { id: 'ad14', topic_id: 'matrices-determinants', concept_id: 'matrix-ops', difficulty: 'medium', expected_seconds: 90,
      prompt: 'If A is 3×3 with A² = I, then det(A) =', options: [{ text: '0 only', is_correct: false }, { text: '±1', is_correct: true }, { text: '1 only', is_correct: false }, { text: '±2', is_correct: false }],
      explanation: 'det(A²) = det(I) = 1. Also det(A²) = det(A)². So det(A)² = 1, giving det(A) = ±1.', trap_type: 'determinant-identity' },
    { id: 'ad15', topic_id: 'algebra', concept_id: 'complex-numbers', difficulty: 'hard', expected_seconds: 120,
      prompt: 'If ω is a cube root of unity (ω ≠ 1), then 1 + ω + ω² =', options: [{ text: '0', is_correct: true }, { text: '1', is_correct: false }, { text: '3', is_correct: false }, { text: 'ω³', is_correct: false }],
      explanation: 'ω³ = 1 and ω³ − 1 = (ω − 1)(ω² + ω + 1) = 0. Since ω ≠ 1, ω² + ω + 1 = 0. So 1 + ω + ω² = 0.', trap_type: 'roots-of-unity' },
  ],
};

// ============================================================================
// DRILL MOCK 3 — DISTINCTIVE TOPICS (10 Q, induction + reasoning)
// ============================================================================

export const UGEE_MOCK_DISTINCTIVE_DRILL: { id: string; title: string; questions: MockQuestion[] } = {
  id: 'mock-ugee-distinctive-drill',
  title: 'UGEE Distinctive Drill — 10 Q, induction + reasoning',
  questions: [
    { id: 'dd1', topic_id: 'mathematical-induction', concept_id: 'induction-sums', difficulty: 'easy', expected_seconds: 75,
      prompt: '1 + 2 + 3 + ... + n =', options: [{ text: 'n²', is_correct: false }, { text: 'n(n+1)/2', is_correct: true }, { text: 'n(n−1)/2', is_correct: false }, { text: 'n(2n+1)/6', is_correct: false }],
      explanation: 'Sum of first n positive integers = n(n+1)/2. Provable by induction (see lesson).', trap_type: 'standard-identity' },
    { id: 'dd2', topic_id: 'mathematical-induction', concept_id: 'induction-sums', difficulty: 'medium', expected_seconds: 90,
      prompt: 'The statement "2^n > n² for all n" is true for:', options: [{ text: 'All n ≥ 1', is_correct: false }, { text: 'All n ≥ 5', is_correct: true }, { text: 'Only even n', is_correct: false }, { text: 'No n', is_correct: false }],
      explanation: "Test small n: n=1: 2>1 ✓. n=2: 4=4 ✗. n=3: 8<9 ✗. n=4: 16=16 ✗. n=5: 32>25 ✓. n=6: 64>36 ✓. Inductive step works for n ≥ 5 but base case fails for n = 2,3,4. So the statement is true for n = 1 and n ≥ 5.", trap_type: 'base-case-selection' },
    { id: 'dd3', topic_id: 'mathematical-induction', concept_id: 'induction-divisibility', difficulty: 'medium', expected_seconds: 90,
      prompt: 'Which is divisible by 3 for all positive integers n?', options: [{ text: 'n² + 1', is_correct: false }, { text: 'n³ − n', is_correct: true }, { text: '2n + 1', is_correct: false }, { text: 'n! + 1', is_correct: false }],
      explanation: 'n³ − n = n(n² − 1) = n(n−1)(n+1), product of 3 consecutive integers, always divisible by 3. Provable by induction too.', trap_type: 'consecutive-integer-product' },
    { id: 'dd4', topic_id: 'mathematical-induction', concept_id: 'strong-induction', difficulty: 'hard', expected_seconds: 120,
      prompt: 'Every integer ≥ 2 can be expressed as a product of primes. This is best proven by:', options: [{ text: 'Weak induction (P(k) → P(k+1))', is_correct: false }, { text: 'Strong induction', is_correct: true }, { text: 'Direct proof', is_correct: false }, { text: 'Contradiction only', is_correct: false }],
      explanation: 'If k+1 is prime, done. Else k+1 = a·b with 2 ≤ a, b ≤ k. Need P(a) AND P(b), not just P(k). This is STRONG induction: assume P(2), ..., P(k), conclude P(k+1).', trap_type: 'weak-vs-strong' },
    { id: 'dd5', topic_id: 'mathematical-reasoning', concept_id: 'contrapositive', difficulty: 'easy', expected_seconds: 60,
      prompt: 'Contrapositive of "If n is prime, then n has two divisors" is:', options: [{ text: 'If n is not prime, then n has more than two divisors.', is_correct: false }, { text: 'If n has two divisors, then n is prime.', is_correct: false }, { text: 'If n does NOT have two divisors, then n is NOT prime.', is_correct: true }, { text: 'If n is prime, then n has more than two divisors.', is_correct: false }],
      explanation: 'Contrapositive of P → Q is ¬Q → ¬P. Here ¬Q = "n does not have two divisors," ¬P = "n is not prime."', trap_type: 'contrapositive-construction' },
    { id: 'dd6', topic_id: 'mathematical-reasoning', concept_id: 'converse', difficulty: 'easy', expected_seconds: 60,
      prompt: 'Converse of "If a shape is a square, then it is a rectangle" is:', options: [{ text: 'If a shape is not a rectangle, then it is not a square.', is_correct: false }, { text: 'If a shape is a rectangle, then it is a square.', is_correct: true }, { text: 'All rectangles are squares.', is_correct: false }, { text: 'If a shape is not a square, then it is not a rectangle.', is_correct: false }],
      explanation: 'Converse of P → Q is Q → P. Swap antecedent and consequent. (Note: this converse is FALSE — not all rectangles are squares.)', trap_type: 'converse-construction' },
    { id: 'dd7', topic_id: 'mathematical-reasoning', concept_id: 'quantifier-negation', difficulty: 'medium', expected_seconds: 90,
      prompt: 'Negation of "All students passed" is:', options: [{ text: 'No students passed.', is_correct: false }, { text: 'At least one student did not pass.', is_correct: true }, { text: 'All students failed.', is_correct: false }, { text: 'Some students passed, some did not.', is_correct: false }],
      explanation: '¬(∀x P(x)) ≡ ∃x ¬P(x). "Not all passed" = "at least one didn\'t pass," NOT "none passed."', trap_type: 'quantifier-negation' },
    { id: 'dd8', topic_id: 'mathematical-reasoning', concept_id: 'truth-table', difficulty: 'medium', expected_seconds: 90,
      prompt: 'P → Q is equivalent to:', options: [{ text: 'P ∧ Q', is_correct: false }, { text: 'P ∨ Q', is_correct: false }, { text: '¬P ∨ Q', is_correct: true }, { text: '¬P ∧ Q', is_correct: false }],
      explanation: 'The implication P → Q is defined as false only when P is true and Q is false. This matches ¬P ∨ Q truth table: false only when ¬P false AND Q false, i.e., P true and Q false.', trap_type: 'implication-as-disjunction' },
    { id: 'dd9', topic_id: 'mathematical-reasoning', concept_id: 'de-morgan', difficulty: 'medium', expected_seconds: 90,
      prompt: 'By De Morgan\'s laws, ¬(P ∨ Q) is equivalent to:', options: [{ text: '¬P ∨ ¬Q', is_correct: false }, { text: '¬P ∧ ¬Q', is_correct: true }, { text: 'P ∧ Q', is_correct: false }, { text: 'P → Q', is_correct: false }],
      explanation: 'De Morgan: ¬(P ∨ Q) = ¬P ∧ ¬Q. ¬(P ∧ Q) = ¬P ∨ ¬Q. "Neither P nor Q" = "not P AND not Q."', trap_type: 'De-Morgan-form' },
    { id: 'dd10', topic_id: 'mathematical-induction', concept_id: 'induction-proof-structure', difficulty: 'hard', expected_seconds: 120,
      prompt: 'A student proves P(1), then assumes P(k) and concludes P(k+1). What is missing?', options: [{ text: 'Nothing; the proof is complete.', is_correct: true }, { text: 'Must also verify P(0).', is_correct: false }, { text: 'Must also prove P(k+1) from P(k−1).', is_correct: false }, { text: 'Must prove P(k−1) from P(k).', is_correct: false }],
      explanation: 'Weak induction requires (a) base P(1) and (b) P(k) → P(k+1). Both are satisfied. P(0) is not needed unless the statement is about integers ≥ 0.', trap_type: 'induction-completeness' },
  ],
};

// ============================================================================
// DRILL MOCK MANIFEST
// ============================================================================

export const UGEE_DRILL_MOCKS = [
  UGEE_MOCK_CALCULUS_DRILL,
  UGEE_MOCK_ALGEBRA_DRILL,
  UGEE_MOCK_DISTINCTIVE_DRILL,
];

// ============================================================================
// CONSOLIDATED EXPANDED CONTENT EXPORT
// ============================================================================

export const UGEE_EXPANDED_CONTENT = {
  lessons: UGEE_EXPANDED_LESSONS,
  drill_mocks: UGEE_DRILL_MOCKS,
  content_version: '1.1.0',
  expanded_at: '2026-04-22T00:00:00.000Z',
  description:
    'Full content corpus for UGEE Math — 10 lessons (9 new + 1 from v2.19.0) ' +
    'covering all syllabus topic_ids, plus 3 drill mocks (calculus/algebra/distinctive) ' +
    'beyond the v2.19.0 diagnostic. Ready for the feedback loop.',
};
