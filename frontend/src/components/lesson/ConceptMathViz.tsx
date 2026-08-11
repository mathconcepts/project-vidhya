/**
 * ConceptMathViz — interactive math visualization panel for lesson pages.
 *
 * Renders an inline function plot (DesmosLite SVG) for the concept's key
 * mathematical object, plus a "Explore on Wolfram Alpha" deep-link so
 * students can verify or go further without a paid API call.
 *
 * Coverage: top GATE-MA concepts across all 8 sections. Unknown concept_ids
 * are silently omitted (no empty box).
 */

import { useState } from 'react';
import { DesmosLite } from './interactives/DesmosLite';
import { ExternalLink, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';

interface VizSpec {
  title: string;
  description: string;
  equation: string;
  sliders?: string;
  xRange?: string;
  wolframQuery: string;
}

// ── Concept-to-visualization map ─────────────────────────────────────────────
// Each entry drives one DesmosLite plot and one Wolfram Alpha deep-link.
// Wolfram queries are kept short (URL-safe after encodeURIComponent).

const CONCEPT_VIZ: Record<string, VizSpec> = {
  // ── Calculus ────────────────────────────────────────────────────────────
  'limits': {
    title: 'sin(x)/x as x → 0',
    description: 'Classic limit: sin(x)/x → 1 as x → 0, even though the function is undefined there.',
    equation: 'sin(x)/x',
    xRange: '-10,10',
    wolframQuery: 'limit of sin(x)/x as x->0',
  },
  'continuity': {
    title: 'Continuity: removing a hole',
    description: 'sin(x)/x has a removable discontinuity at x=0. Defining f(0)=1 makes it continuous.',
    equation: 'sin(x)/x',
    xRange: '-10,10',
    wolframQuery: 'continuity of sin(x)/x',
  },
  'differentiability': {
    title: 'Non-differentiable corner',
    description: 'f(x)=|x| is continuous but not differentiable at x=0 — the slope jumps from -1 to +1.',
    equation: 'abs(x)',
    xRange: '-3,3',
    wolframQuery: 'derivative of abs(x)',
  },
  'derivatives-basic': {
    title: 'Derivative of x²',
    description: 'f(x) = x² has slope f\'(x) = 2x — tangent slope grows linearly with x.',
    equation: 'x^2',
    xRange: '-3,3',
    wolframQuery: 'derivative of x^2',
  },
  'chain-rule': {
    title: 'Composite function sin(x²)',
    description: 'Chain rule: d/dx[sin(x²)] = 2x·cos(x²). Rapid oscillations near x=2.',
    equation: 'sin(x^2)',
    xRange: '-3,3',
    wolframQuery: 'derivative of sin(x^2) chain rule',
  },
  'implicit-differentiation': {
    title: 'Implicit curve y² = x³ - x',
    description: 'Implicit differentiation gives dy/dx without solving explicitly for y.',
    equation: 'x^3 - x',
    xRange: '-2,2',
    wolframQuery: 'implicit differentiation y^2 = x^3 - x',
  },
  'integration-basics': {
    title: 'Antiderivative of x²',
    description: '∫x² dx = x³/3 + C. The area under y=x² grows as x increases.',
    equation: 'x^2',
    xRange: '-3,3',
    wolframQuery: 'integral of x^2',
  },
  'integration-by-parts': {
    title: 'x·e⁻ˣ — decaying envelope',
    description: '∫x·e⁻ˣ dx = -e⁻ˣ(x+1)+C. Integration by parts tames the polynomial-exponential product.',
    equation: 'x*exp(-x)',
    xRange: '0,6',
    wolframQuery: 'integrate x*exp(-x) by parts',
  },
  'integration-substitution': {
    title: 'sin(2x) via substitution',
    description: 'Let u=2x → ∫sin(2x)dx = -cos(2x)/2 + C. Substitution reduces the frequency.',
    equation: 'sin(2*x)',
    xRange: '-5,5',
    wolframQuery: 'integrate sin(2x) substitution method',
  },
  'definite-integrals': {
    title: 'Area under sin(x) on [0,π]',
    description: '∫₀^π sin(x) dx = 2 — exact area trapped between the curve and x-axis.',
    equation: 'sin(x)',
    xRange: '0,6.3',
    wolframQuery: 'definite integral sin(x) from 0 to pi',
  },
  'improper-integrals': {
    title: 'e⁻ˣ on [0,∞)',
    description: '∫₀^∞ e⁻ˣ dx = 1 — the area is finite even over an infinite interval.',
    equation: 'exp(-x)',
    xRange: '0,6',
    wolframQuery: 'improper integral of e^(-x) from 0 to infinity',
  },
  'multivariable-calculus': {
    title: 'Saddle function z = x² - y²',
    description: 'Partial derivatives: ∂z/∂x = 2x, ∂z/∂y = -2y. The saddle point at (0,0) is critical.',
    equation: 'x^2 - 3',
    xRange: '-3,3',
    wolframQuery: 'saddle point of x^2 - y^2',
  },
  'taylor-laurent': {
    title: 'Taylor series for sin(x)',
    description: 'sin(x) ≈ x - x³/6 + x⁵/120 - … Drag the slider to add more terms.',
    equation: 'x - x^3/6 + x^5/120',
    xRange: '-5,5',
    sliders: 'n:1,5,3',
    wolframQuery: 'Taylor series of sin(x)',
  },
  'series': {
    title: 'Geometric series 1/(1-x)',
    description: '∑xⁿ = 1/(1-x) for |x|<1. The sum blows up as x→1⁻.',
    equation: '1/(1-x)',
    xRange: '-0.9,0.9',
    wolframQuery: 'sum of geometric series',
  },

  // ── Linear Algebra ───────────────────────────────────────────────────────
  'matrix-operations': {
    title: 'Linear map y = Ax (1D slice)',
    description: 'A 1×1 linear map multiplies inputs by a constant. Sliders show the effect.',
    equation: '2*x',
    sliders: 'a:0.5,3,2',
    xRange: '-3,3',
    wolframQuery: 'matrix multiplication linear map',
  },
  'determinants': {
    title: 'Characteristic polynomial example',
    description: 'det(A - λI) = 0 gives eigenvalues. For a 2×2 matrix, this is a quadratic λ²-trace·λ+det=0.',
    equation: 'x^2 - 3*x + 2',
    xRange: '-1,4',
    wolframQuery: 'determinant 2x2 matrix characteristic polynomial',
  },
  'rank-nullity': {
    title: 'Null space: Ax = 0',
    description: 'rank(A) + nullity(A) = n. The null space is the set of solutions to Ax = 0.',
    equation: 'x^2 - x',
    xRange: '-1,2',
    wolframQuery: 'rank nullity theorem linear algebra',
  },
  'eigenvalues': {
    title: 'Characteristic polynomial roots',
    description: 'Eigenvalues are roots of det(A - λI) = 0. Example: λ² - 3λ + 2 = 0 gives λ=1,2.',
    equation: 'x^2 - 3*x + 2',
    xRange: '-0.5,3',
    wolframQuery: 'eigenvalues of 2x2 matrix',
  },
  'diagonalization': {
    title: 'Exponential growth of Aⁿ',
    description: 'For a diagonalizable A=PDP⁻¹, Aⁿ=PDⁿP⁻¹. Eigenvalue |λ|>1 means growth.',
    equation: 'x^2',
    xRange: '0,4',
    wolframQuery: 'matrix diagonalization eigenvalues',
  },

  // ── Differential Equations ───────────────────────────────────────────────
  'ode-first-order': {
    title: 'Exponential decay: y\' = -y',
    description: 'Solution: y = Ce⁻ˣ. Every first-order linear ODE has an exponential factor.',
    equation: 'exp(-x)',
    xRange: '0,5',
    wolframQuery: 'solve dy/dx = -y first order ODE',
  },
  'ode-second-order-homo': {
    title: 'Damped oscillation: y\'\' + y\' + y = 0',
    description: 'Complex roots → e⁻ˣ/² · sin(x). Amplitude decays while frequency stays constant.',
    equation: 'exp(-x/2)*sin(x)',
    xRange: '0,10',
    wolframQuery: 'damped harmonic oscillator second order ODE',
  },

  // ── Transforms ───────────────────────────────────────────────────────────
  'laplace-transform': {
    title: 'Laplace kernel e⁻ˢᵗ',
    description: 'The Laplace integral ∫e⁻ˢᵗ f(t)dt weights f(t) by an exponential decay. Drag s.',
    equation: 'exp(-x)',
    sliders: 's:0.2,3,1',
    xRange: '0,5',
    wolframQuery: 'Laplace transform integral definition',
  },
  'inverse-laplace': {
    title: 'Partial fractions give exponentials',
    description: '1/(s+1)(s+2) → e⁻ˣ - e⁻²ˣ via partial fractions. The ILT reverses the transform.',
    equation: 'exp(-x) - exp(-2*x)',
    xRange: '0,5',
    wolframQuery: 'inverse Laplace transform 1/(s+1)(s+2)',
  },
  'laplace-applications': {
    title: 'Exponential step response',
    description: 'Many ODE step responses have shape 1 - e⁻ᵏᵗ — captured via Laplace.',
    equation: '1 - exp(-x)',
    sliders: 'k:0.5,3,1',
    xRange: '0,6',
    wolframQuery: 'Laplace transform step response first order system',
  },
  'fourier-series': {
    title: 'Fourier partial sum (square wave)',
    description: 'sin(x) + sin(3x)/3 + sin(5x)/5 + … converges to a square wave. Gibbs phenomenon at edges.',
    equation: 'sin(x) + sin(3*x)/3 + sin(5*x)/5',
    xRange: '-7,7',
    wolframQuery: 'Fourier series square wave partial sum',
  },
  'fourier-transform': {
    title: 'Gaussian: self-dual under Fourier',
    description: 'The Fourier transform of e⁻ˣ² is another Gaussian. The Gaussian is its own transform.',
    equation: 'exp(-x^2)',
    xRange: '-3,3',
    wolframQuery: 'Fourier transform of Gaussian',
  },

  // ── Complex Analysis ─────────────────────────────────────────────────────
  'complex-numbers': {
    title: 'Modulus of eⁱˣ = cos(x) + i·sin(x)',
    description: 'Euler\'s formula: the real part of eⁱˣ traces cos(x). Modulus |eⁱˣ| = 1.',
    equation: 'cos(x)',
    xRange: '-7,7',
    wolframQuery: "Euler's formula e^(ix) = cos(x) + i*sin(x)",
  },
  'analytic-functions': {
    title: 'Real part of z² = x² - y²',
    description: 'The Cauchy-Riemann equations ensure u=x²-y², v=2xy are harmonic conjugates.',
    equation: 'x^2 - 2',
    xRange: '-3,3',
    wolframQuery: 'Cauchy-Riemann equations analytic function',
  },
  'cauchy-riemann': {
    title: 'Harmonic function u = x² - y²',
    description: '∂²u/∂x² + ∂²u/∂y² = 0. Harmonic functions have no local maxima in the interior.',
    equation: 'x^2 - 2',
    xRange: '-3,3',
    wolframQuery: 'Cauchy-Riemann equations satisfy z^2',
  },
  'complex-integration': {
    title: 'Contour integrand 1/(1+x²)',
    description: '∮ 1/(z²+1) dz = 2πi·Res(i) by residue theorem. Real slice: 1/(1+x²).',
    equation: '1/(1+x^2)',
    xRange: '-5,5',
    wolframQuery: 'residue theorem 1/(z^2+1)',
  },
  'residue-calculus': {
    title: 'Pole at z=i of 1/(z²+1)',
    description: 'Residue = 1/(2i). Cauchy residue theorem: ∮ = 2πi·(sum of residues inside).',
    equation: '1/(1+x^2)',
    xRange: '-4,4',
    wolframQuery: 'residue 1/(z^2+1) at z=i',
  },
  'conformal-mapping': {
    title: 'Möbius map w = (z-1)/(z+1)',
    description: 'Real-axis image: (x-1)/(x+1). Möbius maps send circles/lines to circles/lines.',
    equation: '(x-1)/(x+1)',
    xRange: '-5,-0.1',
    wolframQuery: 'Mobius transformation conformal mapping',
  },

  // ── Probability & Statistics ─────────────────────────────────────────────
  'probability-basics': {
    title: 'Standard normal CDF',
    description: 'CDF of N(0,1) ≈ σ(1.7x). Drag μ and σ to see how they shift/scale the distribution.',
    equation: '1/(1+exp(-1.7*x))',
    xRange: '-4,4',
    wolframQuery: 'normal distribution CDF standard',
  },
  'bayes-theorem': {
    title: 'Prior × Likelihood → Posterior',
    description: 'P(H|E) ∝ P(E|H)·P(H). The prior (blue) gets updated by evidence.',
    equation: 'exp(-x^2/2)',
    xRange: '-4,4',
    wolframQuery: 'Bayes theorem posterior distribution',
  },
  'continuous-distributions': {
    title: 'Normal PDF N(μ,σ²)',
    description: 'f(x) = e⁻ˣ²/2 / √(2π). Drag σ to see bell-curve widening.',
    equation: 'exp(-x^2/2)',
    sliders: 's:0.5,2,1',
    xRange: '-5,5',
    wolframQuery: 'normal distribution probability density function',
  },
  'discrete-distributions': {
    title: 'Poisson probability envelope',
    description: 'Poisson PMF: P(X=k) = λᵏe⁻λ/k! The envelope is the continuous analogue.',
    equation: 'exp(-x)',
    xRange: '0,5',
    wolframQuery: 'Poisson distribution PMF lambda',
  },
  'joint-distributions': {
    title: 'Marginal of bivariate normal (slice)',
    description: 'Marginalizing over y gives a 1D Gaussian. The slice y=0 of f(x,y)=e⁻(x²+y²)/2.',
    equation: 'exp(-x^2)',
    xRange: '-4,4',
    wolframQuery: 'joint bivariate normal marginal distribution',
  },
  'hypothesis-testing': {
    title: 'Test statistic under H₀',
    description: 'Under H₀, the t-statistic follows N(0,1). The shaded tail is the p-value region.',
    equation: 'exp(-x^2/2)',
    xRange: '-4,4',
    wolframQuery: 'hypothesis test p-value normal distribution',
  },

  // ── Discrete Mathematics ─────────────────────────────────────────────────
  'functions-combinatorics': {
    title: 'Binomial coefficient C(n,k)',
    description: 'The number of ways to choose k from n. C(n,k) = n! / (k!(n-k)!). Grows fast.',
    equation: 'x^2 + x + 1',
    xRange: '0,5',
    wolframQuery: 'binomial coefficient combinatorics C(n,k)',
  },
  'counting-principles': {
    title: 'Factorial growth',
    description: 'n! grows faster than exponential. By Stirling: n! ≈ √(2πn)(n/e)ⁿ.',
    equation: 'x^2',
    xRange: '0,5',
    wolframQuery: 'factorial growth Stirling approximation',
  },
  'graph-basics': {
    title: 'Degree sequence sum = 2·|E|',
    description: 'Every edge contributes 1 to each endpoint. Handshaking lemma: Σdeg(v) = 2|E|.',
    equation: '2*x',
    xRange: '0,5',
    wolframQuery: 'handshaking lemma graph theory',
  },
  'graph-coloring': {
    title: 'Chromatic polynomial of a path',
    description: 'P(Pₙ, k) = k(k-1)ⁿ⁻¹. The number of proper k-colorings grows with k.',
    equation: 'x*(x-1)^2',
    xRange: '1,4',
    wolframQuery: 'chromatic polynomial graph coloring',
  },
  'graph-connectivity': {
    title: 'Component count vs. edges',
    description: 'Adding edges reduces components. A spanning tree on n nodes has exactly n-1 edges.',
    equation: 'x + 1',
    xRange: '0,5',
    wolframQuery: 'graph connectivity spanning tree',
  },
  'euler-hamilton': {
    title: 'Euler path condition',
    description: 'An Euler circuit exists iff all vertices have even degree. Verify by degree parity.',
    equation: 'x^2 - x',
    xRange: '0,3',
    wolframQuery: 'Euler circuit Hamiltonian path condition',
  },
  'boolean-algebra': {
    title: 'Boolean function: XOR',
    description: 'XOR is the sum mod 2. In the real-valued interpretation: |x - y| for binary inputs.',
    equation: 'abs(x - 0.5)',
    xRange: '0,1',
    wolframQuery: 'Boolean algebra XOR truth table',
  },

  // ── Numerical Methods ────────────────────────────────────────────────────
  'numerical-integration': {
    title: 'Simpson\'s Rule: sin(x) on [0,π]',
    description: 'Simpson\'s rule: ∫≈ (h/3)[f(a)+4f(m)+f(b)]. Compare to the true area = 2.',
    equation: 'sin(x)',
    xRange: '0,3.2',
    wolframQuery: "Simpson's rule numerical integration",
  },
  'root-finding': {
    title: 'Newton-Raphson: x³ - x - 1 = 0',
    description: 'Newton: xₙ₊₁ = xₙ - f(xₙ)/f\'(xₙ). Converges quadratically near the root ≈ 1.32.',
    equation: 'x^3 - x - 1',
    xRange: '-0.5,2',
    wolframQuery: 'Newton-Raphson method x^3 - x - 1 = 0',
  },
  'interpolation': {
    title: 'Lagrange interpolation of sin(x)',
    description: 'A polynomial through sample points approximates sin(x). More points → better fit.',
    equation: 'sin(x)',
    xRange: '-4,4',
    wolframQuery: 'Lagrange interpolation polynomial',
  },
  'numerical-linear-algebra': {
    title: 'Condition number effect on error',
    description: 'High condition number κ means Ax=b is sensitive. Relative error ≤ κ·(relative residual).',
    equation: 'x^2',
    xRange: '0,4',
    wolframQuery: 'condition number matrix numerical linear algebra',
  },

  // ── Vector Calculus ──────────────────────────────────────────────────────
  'divergence-curl': {
    title: 'Divergence: ∇·F = d(x)/dx + d(y)/dy',
    description: 'Positive divergence = source (flow outward). ∇·F = 2 for F=(x,y).',
    equation: '2*x',
    xRange: '-3,3',
    wolframQuery: 'divergence curl vector field',
  },
  'gradient': {
    title: 'Gradient of f = x² (slope = 2x)',
    description: '∇f = 2x for f=x². The gradient points in the direction of steepest ascent.',
    equation: '2*x',
    xRange: '-3,3',
    wolframQuery: 'gradient vector calculus steepest ascent',
  },
  'greens-theorem': {
    title: 'Green\'s theorem integrand',
    description: '∮ F·dr = ∬(∂Q/∂x - ∂P/∂y)dA. The area under a curve equals the double integral.',
    equation: 'sin(x)*cos(x)',
    xRange: '-4,4',
    wolframQuery: "Green's theorem line integral area",
  },
  'gauss-divergence': {
    title: 'Flux across a surface',
    description: 'Divergence theorem: ∬F·dA = ∭∇·F dV. Flux = total source strength inside.',
    equation: 'x^2 + 1',
    xRange: '-3,3',
    wolframQuery: "Gauss divergence theorem flux surface integral",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface ConceptMathVizProps {
  conceptId: string;
}

export function ConceptMathViz({ conceptId }: ConceptMathVizProps) {
  const [expanded, setExpanded] = useState(true);

  const spec = CONCEPT_VIZ[conceptId];
  if (!spec) return null;

  const wolframUrl = `https://www.wolframalpha.com/input?i=${encodeURIComponent(spec.wolframQuery)}`;

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: 'var(--hairline) solid var(--separator)',
        background: 'var(--surface-card)',
        overflow: 'hidden',
        marginTop: 8,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={14} style={{ color: 'var(--indigo-ink)', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
            {spec.title}
          </span>
        </div>
        {expanded
          ? <ChevronUp size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          : <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          {/* Description */}
          <p style={{ margin: '0 0 12px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            {spec.description}
          </p>

          {/* Plot */}
          <DesmosLite
            attrs={{
              equation: spec.equation,
              sliders: spec.sliders,
              x: spec.xRange,
            }}
          />

          {/* Wolfram link */}
          <a
            href={wolframUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              marginTop: 10,
              fontSize: 'var(--text-caption)',
              color: 'var(--indigo-ink)',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={11} />
            Explore deeper on Wolfram Alpha
          </a>
        </div>
      )}
    </div>
  );
}
