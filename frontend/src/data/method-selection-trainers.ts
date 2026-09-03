/**
 * method-selection-trainers.ts
 *
 * The two shipped method-selection wizards, as DATA (plan W2.5, amendment
 * D2). TheoremWizardPage and DistributionSelectorPage each carried their
 * own hardcoded spec object and their own copy of the reveal/step/progress
 * rendering; both now resolve a trainer from here and hand its spec to the
 * shared `guided_walkthrough` renderer.
 *
 * Two things are true of every trainer below and are the reason the shape
 * is what it is:
 *
 *  1. `steps` is the original page content, VERBATIM. It is required on a
 *     branching spec (D1's `v: 1` compatibility promise — a renderer that
 *     ignores `branches` still has a usable linear walkthrough), and it is
 *     also the receipt that the migration lost nothing: every prompt, hint
 *     and answer the old pages showed is still here, asserted by test.
 *
 *  2. `branches` is the same subject matter as a decision procedure. The
 *     old pages asked "read this scenario, then reveal the answer"; the
 *     tree asks the student to COMMIT to a route first. Each old hint was
 *     the discriminating question in disguise, so it became a node
 *     question; each old answer became the best leaf's reason. The
 *     non-best leaves are new content and carry the work: they say why the
 *     plausible wrong method fails, which is the part a reveal-only wizard
 *     could never teach.
 *
 * Self-check only (E5). Nothing here is graded into StudentModel.
 */

import type { GuidedWalkthroughSpec } from '@/components/lesson/interactives/types';

export interface MethodSelectionTrainer {
  /** Route-stable id. For the theorem wizard this is the `:module` param. */
  id: string;
  /** Page H1. */
  title: string;
  /** Page subhead. */
  description: string;
  spec: GuidedWalkthroughSpec;
}

const LINEAR_ALGEBRA: MethodSelectionTrainer = {
  id: 'linear-algebra',
  title: 'Which Linear Algebra Theorem Applies?',
  description:
    'Work through the decision tree to identify the right theorem for your problem.',
  spec: {
    v: 1,
    kind: 'guided_walkthrough',
    // The widget header is the decision, not the page title — the page H1
    // already names the subject, and repeating it reads as a stutter.
    title: 'Pick the theorem the question is really asking for',
    steps: [
      {
        prompt:
          'You have a square matrix A and need to know if it is invertible. What single number tells you immediately?',
        hint: 'This number is zero when the rows are linearly dependent.',
        answer:
          'det(A). If det(A) ≠ 0, A is invertible. If det(A) = 0, A is singular (not invertible). This follows directly from the definition of the determinant and the invertibility equivalence theorem.',
      },
      {
        prompt:
          'You need to prove that a linear map T: ℝⁿ → ℝⁿ is injective. Which dimension count is the key witness?',
        hint: 'Injective ⟺ the null space contains only the zero vector.',
        answer:
          'nullity(T) = 0, i.e. the null space is {0}. By the Rank-Nullity Theorem, rank(T) = n − nullity(T) = n, so the map is also surjective — injective and surjective square maps are equivalent.',
      },
      {
        prompt: 'You need to compute A¹⁰⁰ efficiently. What structure of A enables this?',
        hint: 'Write A in a basis where the matrix is diagonal.',
        answer:
          'If A is diagonalisable: A = PDP⁻¹, then Aⁿ = PDⁿP⁻¹. Computing Dⁿ is trivial — raise each diagonal entry to the nth power. If A is not diagonalisable, use Cayley-Hamilton to reduce high powers modulo the characteristic polynomial.',
      },
      {
        prompt:
          'A symmetric matrix appears in a quadratic form xᵀAx. What do the eigenvalues tell you about the definiteness?',
        hint: 'Positive-definiteness means xᵀAx > 0 for all x ≠ 0.',
        answer:
          'All eigenvalues > 0 → positive definite. All ≥ 0 → positive semi-definite. All < 0 → negative definite. Mixed signs → indefinite. The Spectral Theorem guarantees real eigenvalues and orthonormal eigenvectors for symmetric A, so the sign of eigenvalues is well-defined.',
      },
    ],
    branches: {
      v: 1,
      nodes: [
        {
          id: 'la_start',
          question: 'What are you being asked about the matrix A?',
          options: [
            { label: 'Whether A is invertible', next: 'la_invertible' },
            { label: 'Whether a linear map is injective', next: 'la_injective' },
            { label: 'A high power such as A¹⁰⁰', next: 'la_power' },
            { label: 'The sign of a quadratic form xᵀAx', next: 'la_definite' },
          ],
        },
        {
          id: 'la_invertible',
          question:
            'One number decides invertibility for a square A, and it is zero exactly when the rows are linearly dependent. Which one?',
          options: [
            { label: 'det(A)', next: 'la_leaf_det' },
            { label: 'trace(A)', next: 'la_leaf_trace' },
            { label: 'The largest entry of A', next: 'la_leaf_entry' },
          ],
        },
        {
          id: 'la_injective',
          question:
            'T: ℝⁿ → ℝⁿ is injective exactly when its null space is {0}. Which dimension count states that?',
          options: [
            { label: 'nullity(T) = 0', next: 'la_leaf_nullity' },
            { label: 'rank(T) = 0', next: 'la_leaf_rank0' },
            { label: 'det(T) = 0', next: 'la_leaf_detzero' },
          ],
        },
        {
          id: 'la_power',
          question:
            'A¹⁰⁰ by repeated multiplication is out. Which structural property of A makes the power cheap?',
          options: [
            { label: 'A is diagonalisable — A = PDP⁻¹', next: 'la_leaf_diag' },
            { label: 'A is symmetric', next: 'la_leaf_symmetric' },
            { label: 'A is invertible', next: 'la_leaf_invertible_power' },
          ],
        },
        {
          id: 'la_definite',
          question:
            'A symmetric A appears in xᵀAx and you need its definiteness. What carries the sign?',
          options: [
            { label: 'The signs of the eigenvalues', next: 'la_leaf_eigen' },
            { label: 'The signs of the diagonal entries', next: 'la_leaf_diag_entries' },
            { label: 'The determinant on its own', next: 'la_leaf_det_alone' },
          ],
        },
      ],
      leaves: [
        {
          id: 'la_leaf_det',
          method: 'det(A) — the invertibility equivalence theorem',
          reason:
            'If det(A) ≠ 0, A is invertible. If det(A) = 0, A is singular. The determinant is the product of the eigenvalues, so it vanishes exactly when some eigenvalue is 0 — which is exactly when the rows are dependent.',
          best: true,
        },
        {
          id: 'la_leaf_trace',
          method: 'trace(A)',
          reason:
            'The trace is the SUM of the eigenvalues, so it can be non-zero while one eigenvalue is 0: [[1,0],[0,0]] has trace 1 and is singular. Only the product — the determinant — is zero exactly when A is.',
        },
        {
          id: 'la_leaf_entry',
          method: 'The largest entry of A',
          reason:
            'No single entry decides invertibility; the all-ones matrix is singular at every size above 1×1 with every entry equal. Invertibility is a statement about the rows taken together, which is what the determinant measures.',
        },
        {
          id: 'la_leaf_nullity',
          method: 'nullity(T) = 0 — Rank-Nullity',
          reason:
            'The null space is {0}. By the Rank-Nullity Theorem, rank(T) = n − nullity(T) = n, so the map is also surjective — for square maps injective and surjective are the same condition.',
          best: true,
        },
        {
          id: 'la_leaf_rank0',
          method: 'rank(T) = 0',
          reason:
            'rank(T) = 0 is the opposite witness: it says T sends every vector to 0, the least injective map there is. You want the rank as LARGE as it can be — rank n — which by Rank-Nullity is the same statement as nullity 0.',
        },
        {
          id: 'la_leaf_detzero',
          method: 'det(T) = 0',
          reason:
            'det = 0 certifies that the null space is bigger than {0}, so it proves the map is NOT injective. The witness you want is det ≠ 0 — or, better, nullity 0, which still means something when the map is not square.',
        },
        {
          id: 'la_leaf_diag',
          method: 'Diagonalise: A = PDP⁻¹, so Aⁿ = PDⁿP⁻¹',
          reason:
            'Computing Dⁿ is trivial — raise each diagonal entry to the nth power. If A is not diagonalisable, use Cayley-Hamilton to reduce high powers modulo the characteristic polynomial.',
          best: true,
        },
        {
          id: 'la_leaf_symmetric',
          method: 'A is symmetric',
          reason:
            'Symmetry is enough — the Spectral Theorem makes a symmetric A orthogonally diagonalisable — but it is more than you need, and most matrices in a power question are not symmetric. Diagonalisability is the property actually doing the work.',
        },
        {
          id: 'la_leaf_invertible_power',
          method: 'A is invertible',
          reason:
            'Invertibility buys you NEGATIVE powers; it says nothing about the cost of positive ones. [[1,1],[0,1]] is invertible and not diagonalisable — for that one, Cayley-Hamilton is the route.',
        },
        {
          id: 'la_leaf_eigen',
          method: 'The eigenvalue signs — the Spectral Theorem',
          reason:
            'All eigenvalues > 0 → positive definite. All ≥ 0 → positive semi-definite. All < 0 → negative definite. Mixed signs → indefinite. The Spectral Theorem guarantees real eigenvalues for symmetric A, so the sign is well-defined.',
          best: true,
        },
        {
          id: 'la_leaf_diag_entries',
          method: 'The diagonal entries',
          reason:
            'Positive diagonal entries are necessary but not sufficient: [[1,2],[2,1]] has both diagonal entries positive and eigenvalues 3 and −1, so it is indefinite. The eigenvalues carry the sign, not the entries.',
        },
        {
          id: 'la_leaf_det_alone',
          method: 'The determinant on its own',
          reason:
            'One determinant cannot separate "all eigenvalues positive" from "an even number of them negative" — in even dimensions both give a positive determinant. The full leading-minor sequence (Sylvester’s criterion) works; a single determinant does not.',
        },
      ],
    },
    caption:
      'Every route is walkable. Pick the one you would actually take and read why it lands where it does.',
  },
};

const VECTOR_CALCULUS: MethodSelectionTrainer = {
  id: 'vector-calculus',
  title: 'Which Vector Calculus Theorem Applies?',
  description: 'Identify the right integral theorem for your boundary/surface problem.',
  spec: {
    v: 1,
    kind: 'guided_walkthrough',
    title: 'Green, Stokes or Gauss?',
    steps: [
      {
        prompt:
          'You have a line integral ∮_C F·dr around a closed curve in 2-D and F is a vector field. Which theorem converts this to a double integral?',
        hint: 'Named after a British mathematician; relates circulation to the 2-D curl.',
        answer:
          "Green's Theorem: ∮_C F·dr = ∬_D (∂Q/∂x − ∂P/∂y) dA. Use it when the curve is closed, simple, and the region D is well-defined. F = (P, Q) must have continuous partial derivatives on D.",
      },
      {
        prompt:
          'You have a surface integral ∬_S (curl F)·dS. Which theorem reduces it to a line integral around the boundary ∂S?',
        hint: "This is the 3-D generalisation of Green's Theorem.",
        answer:
          "Stokes' Theorem: ∬_S (curl F)·dS = ∮_{∂S} F·dr. The surface S must be orientable and smooth; the boundary curve ∂S must have the orientation induced by S's normal (right-hand rule).",
      },
      {
        prompt:
          'You need to compute the outward flux ∬_S F·dS over a closed surface S. Which theorem converts this to a triple integral?',
        hint: 'Also called the Gauss Divergence Theorem.',
        answer:
          'The Divergence Theorem: ∬_S F·dS = ∭_V (div F) dV. Use when S is the closed boundary of a solid region V and F has continuous partial derivatives on V. Check that div F = ∂F₁/∂x + ∂F₂/∂y + ∂F₃/∂z is simpler than the surface integral.',
      },
    ],
    branches: {
      v: 1,
      nodes: [
        {
          id: 'vc_start',
          question: 'What is the integral in front of you taken over?',
          options: [
            { label: 'A closed curve C', next: 'vc_curve' },
            { label: 'A surface S', next: 'vc_surface' },
          ],
        },
        {
          id: 'vc_curve',
          question: 'Where does that curve live?',
          options: [
            { label: 'Flat in the xy-plane, bounding a region D', next: 'vc_plane_pick' },
            { label: 'Out in 3-D, bounding a surface S', next: 'vc_space_pick' },
          ],
        },
        {
          id: 'vc_surface',
          question: 'Is the surface closed — does it bound a solid region V?',
          options: [
            { label: 'Closed: it encloses a solid (a sphere, a box)', next: 'vc_closed_pick' },
            { label: 'Open: it has a boundary curve ∂S', next: 'vc_space_pick' },
          ],
        },
        {
          id: 'vc_plane_pick',
          question:
            'Which theorem turns ∮_C F·dr around a plane curve into a double integral over D?',
          options: [
            { label: "Green's theorem", next: 'vc_leaf_green' },
            { label: "Stokes' theorem", next: 'vc_leaf_stokes_overkill' },
            { label: 'The divergence theorem', next: 'vc_leaf_div_no_solid' },
          ],
        },
        {
          id: 'vc_space_pick',
          question:
            'A loop in 3-D and the surface it bounds. Which theorem trades one for the other?',
          options: [
            { label: "Stokes' theorem", next: 'vc_leaf_stokes' },
            { label: "Green's theorem", next: 'vc_leaf_green_flat_only' },
            { label: 'The divergence theorem', next: 'vc_leaf_div_needs_closed' },
          ],
        },
        {
          id: 'vc_closed_pick',
          question:
            'You want the outward flux ∬_S F·dS through that closed surface. Which theorem?',
          options: [
            { label: 'The divergence theorem', next: 'vc_leaf_gauss' },
            { label: "Stokes' theorem", next: 'vc_leaf_stokes_no_boundary' },
            { label: "Green's theorem", next: 'vc_leaf_green_2d_only' },
          ],
        },
      ],
      leaves: [
        {
          id: 'vc_leaf_green',
          method: "Green's theorem: ∮_C F·dr = ∬_D (∂Q/∂x − ∂P/∂y) dA",
          reason:
            'Use it when the curve is closed, simple, and the region D is well-defined. F = (P, Q) must have continuous partial derivatives on D.',
          best: true,
        },
        {
          id: 'vc_leaf_stokes_overkill',
          method: "Stokes' theorem",
          reason:
            "Stokes is not false here — Green's theorem is its flat special case — but on a plane curve it makes you build a surface and an orientation you did not need. Reach for Green first and keep the whole computation in two dimensions.",
        },
        {
          id: 'vc_leaf_div_no_solid',
          method: 'The divergence theorem',
          reason:
            'The divergence theorem trades a closed SURFACE for the solid it encloses. A curve in the plane bounds no solid, so there is nothing for the theorem to convert.',
        },
        {
          id: 'vc_leaf_stokes',
          method: "Stokes' theorem: ∬_S (curl F)·dS = ∮_{∂S} F·dr",
          reason:
            "The surface S must be orientable and smooth; the boundary curve ∂S must have the orientation induced by S's normal (right-hand rule). Any surface with that boundary works — pick the easiest one.",
          best: true,
        },
        {
          id: 'vc_leaf_green_flat_only',
          method: "Green's theorem",
          reason:
            "Green's theorem is Stokes' theorem restricted to a flat region in the xy-plane. Your curve leaves the plane, so the double integral it produces has no region to sit on.",
        },
        {
          id: 'vc_leaf_div_needs_closed',
          method: 'The divergence theorem',
          reason:
            'The divergence theorem needs a CLOSED surface bounding a solid. A surface with a boundary curve is open, so the theorem does not reach it.',
        },
        {
          id: 'vc_leaf_gauss',
          method: 'The Divergence Theorem: ∬_S F·dS = ∭_V (div F) dV',
          reason:
            'Use when S is the closed boundary of a solid region V and F has continuous partial derivatives on V. Check that div F = ∂F₁/∂x + ∂F₂/∂y + ∂F₃/∂z is simpler than the surface integral before you commit.',
          best: true,
        },
        {
          id: 'vc_leaf_stokes_no_boundary',
          method: "Stokes' theorem",
          reason:
            "Stokes needs a boundary curve to hand the integral to, and a closed surface has none — which is exactly why ∬_S (curl F)·dS = 0 over any closed S. A useful fact, but it does not compute the flux of F itself.",
        },
        {
          id: 'vc_leaf_green_2d_only',
          method: "Green's theorem",
          reason:
            "Green's theorem is a statement about a flat region in the plane. A closed surface in 3-D is outside its reach; the divergence theorem is the 3-D statement you want.",
        },
      ],
    },
    caption:
      'Every route is walkable. Pick the one you would actually take and read why it lands where it does.',
  },
};

const DISTRIBUTIONS: MethodSelectionTrainer = {
  id: 'distribution-selector',
  title: 'Which Probability Distribution?',
  description:
    'Classify the scenario, commit to a distribution, and read why that route lands where it does.',
  spec: {
    v: 1,
    kind: 'guided_walkthrough',
    title: 'Discrete or continuous — then which one?',
    steps: [
      {
        prompt:
          'A call centre receives on average 8 calls per hour. You want to find the probability of exactly 5 calls arriving in the next hour. Which distribution do you use?',
        hint: 'The events occur at a known average rate, independently, over a fixed interval of time.',
        answer:
          'Poisson(λ=8). Use the Poisson distribution whenever you count the number of occurrences of an independent event in a fixed interval, given only the mean rate λ. P(X=k) = e^{−λ} λ^k / k!.',
      },
      {
        prompt:
          'A factory produces bolts; each bolt independently has a 2% defect probability. A box contains 50 bolts. What is the probability that exactly 3 are defective?',
        hint: 'Fixed n trials, each with the same success probability, independent of one another.',
        answer:
          'Binomial(n=50, p=0.02). The Binomial counts successes in n independent Bernoulli trials with constant probability p. P(X=k) = C(n,k) p^k (1−p)^{n−k}. (Poisson approximation Poisson(1) also works here since n is large and p small, but Binomial is exact.)',
      },
      {
        prompt:
          'A survey reports that 30% of voters support a policy. You sample until you find the first supporter. What distribution models the number of people you need to survey?',
        hint: 'You are counting trials until the first success.',
        answer:
          'Geometric(p=0.30). The Geometric distribution models the number of independent Bernoulli trials needed to obtain the first success. P(X=k) = (1−p)^{k−1} p. Mean = 1/p = 3.33 surveys on average.',
      },
      {
        prompt:
          'The time (in minutes) until a bus arrives is equally likely to be anywhere between 0 and 15 minutes. What distribution describes the waiting time, and what is its mean?',
        hint: 'Every value in a finite continuous interval is equally probable.',
        answer:
          'Uniform(a=0, b=15). The Continuous Uniform distribution on [a,b] has PDF f(x) = 1/(b−a). Mean = (a+b)/2 = 7.5 min; Var = (b−a)²/12 = 18.75 min².',
      },
      {
        prompt:
          'IQ scores in a population have mean 100 and standard deviation 15. What is the probability that a randomly chosen person has IQ > 130?',
        hint: 'The sum of many independent effects; shape is the bell curve.',
        answer:
          'Normal(μ=100, σ=15). Standardise: Z = (130−100)/15 = 2. P(X>130) = P(Z>2) ≈ 0.0228 (from the standard normal table). By the Central Limit Theorem, aggregated continuous measurements cluster around the Normal.',
      },
      {
        prompt:
          'A machine part fails after an exponentially distributed lifetime with mean 200 hours. What is the probability it survives past 300 hours?',
        hint: 'Continuous time-to-failure; the only continuous memoryless distribution.',
        answer:
          'Exponential(λ=1/200). P(X>300) = e^{−λt} = e^{−300/200} = e^{−1.5} ≈ 0.223. The memoryless property: the remaining lifetime has the same distribution regardless of how long it has already run.',
      },
    ],
    branches: {
      v: 1,
      nodes: [
        {
          id: 'ds_start',
          question: 'Is the quantity you are modelling a count, or a measurement on a continuous scale?',
          options: [
            { label: 'A count of occurrences', next: 'ds_discrete' },
            { label: 'A continuous measurement — time, length, a score', next: 'ds_continuous' },
          ],
        },
        {
          id: 'ds_discrete',
          question: 'What fixes the counting?',
          options: [
            {
              label: 'A fixed number n of independent trials, each with the same probability p',
              next: 'ds_binomial_pick',
            },
            {
              label: 'A known average rate over a fixed interval, with no fixed number of trials',
              next: 'ds_poisson_pick',
            },
            { label: 'Repeat trials until the first success', next: 'ds_geometric_pick' },
          ],
        },
        {
          id: 'ds_binomial_pick',
          question:
            '50 bolts, each independently defective with probability 0.02, and you want exactly 3 defective. Which distribution?',
          options: [
            { label: 'Binomial(n=50, p=0.02)', next: 'ds_leaf_binomial' },
            { label: 'Poisson(λ = np = 1)', next: 'ds_leaf_poisson_approx' },
            { label: 'Geometric(p=0.02)', next: 'ds_leaf_geometric_wrong' },
          ],
        },
        {
          id: 'ds_poisson_pick',
          question:
            'A call centre averages 8 calls an hour and you want the probability of exactly 5 in the next hour. Which distribution?',
          options: [
            { label: 'Poisson(λ=8)', next: 'ds_leaf_poisson' },
            { label: 'Binomial(n, p)', next: 'ds_leaf_binomial_no_n' },
            { label: 'Exponential(λ=8)', next: 'ds_leaf_exponential_gap' },
          ],
        },
        {
          id: 'ds_geometric_pick',
          question:
            '30% of voters support a policy and you sample until the first supporter. Which distribution models the number surveyed?',
          options: [
            { label: 'Geometric(p=0.30)', next: 'ds_leaf_geometric' },
            { label: 'Binomial(n, p=0.30)', next: 'ds_leaf_binomial_no_fixed_n' },
            { label: 'Poisson(λ=0.30)', next: 'ds_leaf_poisson_no_interval' },
          ],
        },
        {
          id: 'ds_continuous',
          question: 'What shape does the continuous quantity have?',
          options: [
            { label: 'Every value in a finite interval is equally likely', next: 'ds_uniform_pick' },
            {
              label: 'A lifetime or waiting time with no memory of how long it has run',
              next: 'ds_exponential_pick',
            },
            {
              label: 'The sum of many small independent effects — a bell curve',
              next: 'ds_normal_pick',
            },
          ],
        },
        {
          id: 'ds_uniform_pick',
          question:
            'A bus is equally likely to arrive anywhere in the next 15 minutes. Which distribution?',
          options: [
            { label: 'Uniform(a=0, b=15)', next: 'ds_leaf_uniform' },
            { label: 'Normal(μ=7.5, σ)', next: 'ds_leaf_normal_bounded' },
            { label: 'Exponential(λ)', next: 'ds_leaf_exponential_decay' },
          ],
        },
        {
          id: 'ds_exponential_pick',
          question:
            'A part fails after a memoryless lifetime averaging 200 hours. Which distribution?',
          options: [
            { label: 'Exponential(λ=1/200)', next: 'ds_leaf_exponential' },
            { label: 'Uniform(0, 400)', next: 'ds_leaf_uniform_lifetime' },
            { label: 'Normal(μ=200, σ)', next: 'ds_leaf_normal_lifetime' },
          ],
        },
        {
          id: 'ds_normal_pick',
          question:
            'IQ scores have mean 100 and standard deviation 15 and you want P(IQ > 130). Which distribution?',
          options: [
            { label: 'Normal(μ=100, σ=15)', next: 'ds_leaf_normal' },
            { label: 'Poisson(λ=100)', next: 'ds_leaf_poisson_continuous' },
            { label: 'Uniform(a, b)', next: 'ds_leaf_uniform_flat' },
          ],
        },
      ],
      leaves: [
        {
          id: 'ds_leaf_binomial',
          method: 'Binomial(n=50, p=0.02)',
          reason:
            'The Binomial counts successes in n independent Bernoulli trials with constant probability p. P(X=k) = C(n,k) p^k (1−p)^{n−k}.',
          best: true,
        },
        {
          id: 'ds_leaf_poisson_approx',
          method: 'Poisson(λ = np = 1)',
          reason:
            'Poisson(1) is the large-n, small-p APPROXIMATION and here it is a good one. But n is fixed at 50 and p is known, so the Binomial is exact for the same work — take the exact answer when it is offered.',
        },
        {
          id: 'ds_leaf_geometric_wrong',
          method: 'Geometric(p=0.02)',
          reason:
            'The Geometric counts trials until the first success, so it answers "when", not "how many". With the box size fixed at 50, the question is how many of those 50 are defective.',
        },
        {
          id: 'ds_leaf_poisson',
          method: 'Poisson(λ=8)',
          reason:
            'Use the Poisson whenever you count occurrences of an independent event in a fixed interval, given only the mean rate λ. P(X=k) = e^{−λ} λ^k / k!.',
          best: true,
        },
        {
          id: 'ds_leaf_binomial_no_n',
          method: 'Binomial(n, p)',
          reason:
            'The Binomial needs a fixed number of trials n and a per-trial probability p. A call can arrive at any instant, so there is no n to put in the formula. The Poisson is what survives when n disappears and only the rate λ remains.',
        },
        {
          id: 'ds_leaf_exponential_gap',
          method: 'Exponential(λ=8)',
          reason:
            'The Exponential carries the same λ but answers the other question: it models the WAITING TIME between calls, a continuous quantity. You were asked for the probability of a count, so the Poisson is the one.',
        },
        {
          id: 'ds_leaf_geometric',
          method: 'Geometric(p=0.30)',
          reason:
            'The Geometric models the number of independent Bernoulli trials needed to obtain the first success. P(X=k) = (1−p)^{k−1} p. Mean = 1/p = 3.33 surveys.',
          best: true,
        },
        {
          id: 'ds_leaf_binomial_no_fixed_n',
          method: 'Binomial(n, p=0.30)',
          reason:
            'The Binomial fixes n in advance and lets the number of successes vary. Here the roles are swapped: the successes are fixed at one and the number surveyed is the random quantity.',
        },
        {
          id: 'ds_leaf_poisson_no_interval',
          method: 'Poisson(λ=0.30)',
          reason:
            'Poisson needs a fixed interval and a mean rate over it. There is no interval here — only repeated trials, each with the same probability p, run until one succeeds.',
        },
        {
          id: 'ds_leaf_uniform',
          method: 'Uniform(a=0, b=15)',
          reason:
            'The Continuous Uniform on [a,b] has PDF f(x) = 1/(b−a). Mean = (a+b)/2 = 7.5 min; Var = (b−a)²/12 = 18.75 min².',
          best: true,
        },
        {
          id: 'ds_leaf_normal_bounded',
          method: 'Normal(μ=7.5, σ)',
          reason:
            'The Normal puts most of its mass near the mean and runs tails to ±∞. A bus that never takes more than 15 minutes and is no likelier at 7 than at 14 has neither feature — the density is flat, then stops.',
        },
        {
          id: 'ds_leaf_exponential_decay',
          method: 'Exponential(λ)',
          reason:
            'The Exponential density is highest at 0 and decays from there, and it allows arbitrarily long waits. Neither matches "equally likely anywhere in [0, 15]".',
        },
        {
          id: 'ds_leaf_exponential',
          method: 'Exponential(λ=1/200)',
          reason:
            'P(X>300) = e^{−λt} = e^{−300/200} = e^{−1.5} ≈ 0.223. The memoryless property: the remaining lifetime has the same distribution however long the part has already run.',
          best: true,
        },
        {
          id: 'ds_leaf_uniform_lifetime',
          method: 'Uniform(0, 400)',
          reason:
            'A uniform lifetime has a hard ceiling at 400 hours and its failure rate climbs as the part approaches it — the opposite of memoryless. Ask whether a part that has already run 200 hours is any likelier to fail in the next minute.',
        },
        {
          id: 'ds_leaf_normal_lifetime',
          method: 'Normal(μ=200, σ)',
          reason:
            'A Normal lifetime gives positive probability to a NEGATIVE lifetime, and it is not memoryless. It models a measurement clustered around a mean, not a time to failure.',
        },
        {
          id: 'ds_leaf_normal',
          method: 'Normal(μ=100, σ=15)',
          reason:
            'Standardise: Z = (130−100)/15 = 2, so P(X>130) = P(Z>2) ≈ 0.0228. By the Central Limit Theorem, measurements built from many small independent effects cluster around the Normal.',
          best: true,
        },
        {
          id: 'ds_leaf_poisson_continuous',
          method: 'Poisson(λ=100)',
          reason:
            'Poisson is a count — it lives on 0, 1, 2, … An IQ is a continuous measurement, so no integer-valued distribution can hold it.',
        },
        {
          id: 'ds_leaf_uniform_flat',
          method: 'Uniform(a, b)',
          reason:
            'A uniform IQ would make 145 exactly as common as 100. The Central Limit Theorem is the reason it is not: pile up many small independent effects and the mass gathers in the middle.',
        },
      ],
    },
    caption:
      'Every route is walkable. Pick the one you would actually take and read why it lands where it does.',
  },
};

/**
 * NUMERICAL_METHODS / TRANSFORM_THEORY / GRAPH_THEORY (micro-solver wave 1,
 * 2026-09-03) — the first three trainers built as SINGLE-fork trees rather
 * than a whole topic classification chain (TODOS.md's "Micro-solver
 * authoring pass" entry). Each is exactly one `BranchNode` + its leaves —
 * the same schema a 6-fork tree uses, just with `nodes.length === 1` — so
 * a topic gets tailored guidance for one concrete concept without anyone
 * drafting a full multi-fork tree first. `steps[0]` (required by
 * `GuidedWalkthroughSpec` so a non-branch-aware renderer still has
 * something to show) is derived directly from the node/best-leaf pair
 * below it, not independently authored — there is no second copy of this
 * content to keep in sync. Authored via Claude Sonnet subagents (one per
 * topic, isolated worktrees, no shared file access) per the user's
 * explicit direction; every mathematical/technical claim was hand-verified
 * by each subagent (Wolfram MCP was unavailable this session) before this
 * file incorporated it — see each trainer's `caption` for how the check
 * was performed.
 */
const NUMERICAL_METHODS: MethodSelectionTrainer = {
  id: 'numerical-methods',
  title: 'Which Numerical Method Applies?',
  description:
    'Pick the right root-finding method for exactly what you know about f(x) — a bracket, a derivative, or just two guesses.',
  spec: {
    v: 1,
    kind: 'guided_walkthrough',
    title: 'Bisection, Newton-Raphson or Secant?',
    steps: [
      {
        prompt:
          'You want the root of f(x) = x² − 2 = 0 (i.e. √2). You know the derivative f′(x) = 2x, and you have one good starting guess x₀ = 1.5, already close to the true root ≈ 1.41421. Which method is the right tool here?',
        hint: 'You were handed a derivative AND a single close guess — which method asks for exactly that pair?',
        answer:
          'Newton-Raphson: x₁ = x₀ − f(x₀)/f′(x₀) = 1.5 − 0.25/3 ≈ 1.41667, already within 0.0025 of √2. A second step gives x₂ ≈ 1.414216 — the number of correct digits roughly doubles each step (quadratic convergence), the fastest of the three when it applies.',
      },
    ],
    branches: {
      v: 1,
      nodes: [
        {
          id: 'nm_root_pick',
          question:
            'You want the root of f(x) = x² − 2 = 0 (i.e. √2). You know the derivative f′(x) = 2x, and you have one good starting guess x₀ = 1.5, already close to the true root ≈ 1.41421. Which method is the right tool here?',
          options: [
            { label: 'Newton-Raphson method', next: 'nm_leaf_newton' },
            { label: 'Bisection method', next: 'nm_leaf_bisection' },
            { label: 'Secant method', next: 'nm_leaf_secant' },
          ],
        },
      ],
      leaves: [
        {
          id: 'nm_leaf_newton',
          method: 'Newton-Raphson method',
          reason:
            'You have exactly what Newton-Raphson asks for: a formula for f′(x) and a single guess already close to the root. It replaces the curve near x₀ with its tangent line and jumps to where that line crosses zero: x₁ = x₀ − f(x₀)/f′(x₀). Starting at x₀ = 1.5, f(1.5) = 0.25 and f′(1.5) = 3, so x₁ = 1.5 − 0.25/3 ≈ 1.41667 — already within 0.0025 of √2. One more step gives x₂ ≈ 1.414216, accurate to five decimal places. That is the signature of Newton-Raphson: once you are close, the number of correct digits roughly doubles every step (quadratic convergence) — the fastest of the three methods when it applies.',
          best: true,
        },
        {
          id: 'nm_leaf_bisection',
          method: 'Bisection method',
          reason:
            'Bisection needs two points a and b where f(a) and f(b) have opposite signs, so you know a root is trapped somewhere between them. You were not given a bracketing pair here, only a single starting value — so before you could even begin, you would have to go hunting for two such points. And even after finding one, bisection would ignore the derivative you were already handed and just repeatedly halve the interval, gaining roughly one more correct digit every 3-4 steps (linear convergence). It is the reliable fallback when you have no derivative and only a bracket — not the right choice when you already have both f′(x) and a good single guess.',
        },
        {
          id: 'nm_leaf_secant',
          method: 'Secant method',
          reason:
            'Secant is the natural substitute for Newton-Raphson precisely when you do NOT have (or do not want to compute) f′(x) — it approximates the tangent line’s slope using two nearby points instead. But here f′(x) = 2x was already handed to you for free, so switching to secant means throwing that away for no reason: it needs a second starting guess you do not have yet, and even once running it only converges superlinearly (order ≈ 1.618, the golden ratio) — slower than the quadratic convergence Newton-Raphson gets from the exact derivative you already have.',
        },
      ],
    },
    caption:
      'Every route is walkable. Pick the one you would actually take and read why it lands where it does.',
  },
};

const TRANSFORM_THEORY: MethodSelectionTrainer = {
  id: 'transform-theory',
  title: 'Laplace, Fourier or Z-Transform?',
  description: 'Read the signal, then commit to the transform built for it.',
  spec: {
    v: 1,
    kind: 'guided_walkthrough',
    title: 'Which transform is the natural tool?',
    steps: [
      {
        prompt:
          'You have a continuous function y(t), defined for t ≥ 0 and not periodic, and you are given initial conditions y(0), y′(0) for a linear ODE it satisfies. Which transform is the natural tool for solving it?',
        hint: 'Continuous, not periodic, and initial conditions matter — which transform’s derivative rule actually uses f(0)?',
        answer:
          'The Laplace transform. Its derivative rule L{f′(t)} = sF(s) − f(0) puts f(0) directly into the algebra, so an ODE plus initial conditions becomes one algebraic equation in s.',
      },
    ],
    branches: {
      v: 1,
      nodes: [
        {
          id: 'tt_transform_pick',
          question:
            'You have a continuous function y(t), defined for t ≥ 0 and not periodic, and you are given initial conditions y(0), y′(0) for a linear ODE it satisfies. Which transform is the natural tool for solving it?',
          options: [
            { label: 'Laplace transform', next: 'tt_leaf_laplace' },
            { label: 'Fourier series / Fourier transform', next: 'tt_leaf_fourier' },
            { label: 'Z-transform', next: 'tt_leaf_z' },
          ],
        },
      ],
      leaves: [
        {
          id: 'tt_leaf_laplace',
          method: 'Laplace transform — L{f(t)} = ∫₀^∞ f(t)e^{−st} dt',
          reason:
            'This is exactly the setup Laplace is built for: a continuous-time function on t ≥ 0, with no periodicity assumed, where you are handed initial data. The derivative rule L{f′(t)} = sF(s) − f(0) puts f(0) directly into the algebra, so an ODE plus initial conditions becomes one algebraic equation in s — solve for Y(s), then invert. That is precisely why Laplace, not Fourier, is the standard tool for initial-value problems.',
          best: true,
        },
        {
          id: 'tt_leaf_fourier',
          method: 'Fourier series / Fourier transform',
          reason:
            'Fourier series needs the function to be periodic, which this one is not — there is no interval to expand it over. The Fourier transform does not require periodicity, but it is built for a different job: decomposing a signal into frequencies, not carrying initial-condition data. Its derivative rule, F{f′(t)} = iω F(ω), has no term for f(0) — it is derived by integrating by parts over all of ℝ, where boundary contributions vanish, so there is simply nowhere for an initial condition to enter the algebra the way it does for Laplace.',
        },
        {
          id: 'tt_leaf_z',
          method: 'Z-transform',
          reason:
            'The Z-transform is for discrete-time sequences x[n] — it is the discrete analogue of Laplace, used to turn linear difference equations into algebraic ones in z. Here y(t) is a continuous function of a real variable t, not a sequence, so there is nothing indexed by n to transform. Reach for the Z-transform only once the problem is genuinely discrete-time.',
        },
      ],
    },
    caption:
      'Every route is walkable. Pick the one you would actually take and read why it lands where it does.',
  },
};

const GRAPH_THEORY: MethodSelectionTrainer = {
  id: 'graph-theory',
  title: 'Which Shortest-Path Algorithm Applies?',
  description:
    "Match the graph's weight structure and what the question actually asks for (single-source or all-pairs) to the correct shortest-path algorithm.",
  spec: {
    v: 1,
    kind: 'guided_walkthrough',
    title: 'BFS, Dijkstra, Bellman-Ford or Floyd-Warshall?',
    steps: [
      {
        prompt:
          'A directed graph models currency conversions between accounts: each edge’s weight is the cost of that conversion, and some weights are negative (a conversion that turns a profit), though no cycle of conversions anywhere in the graph is profitable overall (no negative-weight cycle is reachable from the source account). You need the cheapest path from one specific source account to every other account — not the full table of cheapest paths between every pair of accounts. Which algorithm is the right tool?',
        hint: 'Negative weights rule out one usual favourite; single-source (not all-pairs) rules out another.',
        answer:
          'Bellman-Ford: it relaxes every edge V−1 times (O(V·E)) and correctly propagates shortest distances from a single source even with negative edges, as long as no negative-weight cycle is reachable from the source.',
      },
    ],
    branches: {
      v: 1,
      nodes: [
        {
          id: 'gt_shortest_pick',
          question:
            'A directed graph models currency conversions between accounts: each edge’s weight is the cost of that conversion, and some weights are negative (a conversion that turns a profit), though no cycle of conversions anywhere in the graph is profitable overall (no negative-weight cycle is reachable from the source account). You need the cheapest path from one specific source account to every other account — not the full table of cheapest paths between every pair of accounts. Which algorithm is the right tool?',
          options: [
            { label: 'BFS (breadth-first search)', next: 'gt_leaf_bfs' },
            { label: "Dijkstra's algorithm", next: 'gt_leaf_dijkstra' },
            { label: 'Bellman-Ford algorithm', next: 'gt_leaf_bellman_ford' },
            { label: 'Floyd-Warshall algorithm', next: 'gt_leaf_floyd_warshall' },
          ],
        },
      ],
      leaves: [
        {
          id: 'gt_leaf_bfs',
          method: 'BFS (breadth-first search)',
          reason:
            "BFS finds shortest paths correctly only when every edge costs the same — its level-by-level expansion is implicitly counting hops, which equals true shortest distance only in an unweighted graph (or one where every weight is equal, e.g. all 1s). Here the edges carry different costs, some even negative, so a hop count would not match the actual cheapest-path cost at all. This isn't a speed problem — BFS in O(V+E) is fast — it's the wrong quantity to compute.",
        },
        {
          id: 'gt_leaf_dijkstra',
          method: "Dijkstra's algorithm",
          reason:
            "Dijkstra greedily finalizes each vertex's distance in increasing order, on the assumption that once a vertex has the smallest current tentative distance, no edge discovered later can ever produce a shorter path to it. A negative edge weight can break that assumption: a later negative-weight edge can create a cheaper route to a vertex Dijkstra has already 'locked in', so it can report a distance that is simply wrong. Dijkstra requires all edge weights to be non-negative, which this graph does not guarantee.",
        },
        {
          id: 'gt_leaf_bellman_ford',
          method: 'Bellman-Ford algorithm',
          reason:
            'Bellman-Ford relaxes every edge V−1 times (O(V·E) total), which is enough to correctly propagate shortest distances from a single source even when some edges are negative, provided no negative-weight cycle is reachable from that source (which the scenario states, and which one further relaxation pass could confirm by detecting any violation). That is exactly this situation — single-source shortest paths where negative weights are possible — so Bellman-Ford is the right choice, even though it costs more than Dijkstra’s roughly O(E log V) on a graph that happened to have only non-negative weights.',
          best: true,
        },
        {
          id: 'gt_leaf_floyd_warshall',
          method: 'Floyd-Warshall algorithm',
          reason:
            "Floyd-Warshall's dynamic program computes shortest paths between EVERY pair of vertices in one O(V³) pass, and it does tolerate negative edge weights (again, as long as there's no negative cycle) — so it wouldn't give a wrong answer here. But the question asks for distances from only one specific source, not the full V×V distance matrix, so Floyd-Warshall computes far more than is needed, at a higher time cost than Bellman-Ford's O(V·E), which solves exactly the single-source problem being asked.",
        },
      ],
    },
    caption:
      'Every route is walkable. Pick the one you would actually take and read why it lands where it does.',
  },
};

const DIFFERENTIAL_EQUATIONS: MethodSelectionTrainer = {
  id: 'differential-equations',
  title: 'Which First-Order ODE Method Applies?',
  description:
    "Given a first-order ODE, decide whether to separate variables, use an integrating factor, or test for exactness — and see why the other two methods don't fit this equation.",
  spec: {
    v: 1,
    kind: 'guided_walkthrough',
    title: 'Separable, linear or exact?',
    steps: [
      {
        prompt: "You're given the differential equation dy/dx = 2xy². Which method should you use to solve it?",
        hint: 'Try to split the right side into a function of x times a function of y.',
        answer:
          'Separate: 2xy² = (2x)·(y²), so (1/y²) dy = 2x dx. Integrate: −1/y = x² + C, so y = −1/(x² + C).',
      },
    ],
    branches: {
      v: 1,
      nodes: [
        {
          id: 'de_method_pick',
          question: "You're given the differential equation dy/dx = 2xy². Which method should you use to solve it?",
          options: [
            { label: 'Separate the variables', next: 'de_leaf_separable' },
            { label: 'Use an integrating factor (treat it as linear)', next: 'de_leaf_linear' },
            { label: 'Test for exactness and find a potential function', next: 'de_leaf_exact' },
          ],
        },
      ],
      leaves: [
        {
          id: 'de_leaf_separable',
          method: 'Separation of variables',
          reason:
            'The right side factors cleanly into a function of x times a function of y: 2xy² = (2x)·(y²). Divide both sides by y² to get (1/y²) dy = 2x dx, then integrate directly: −1/y = x² + C, so y = −1/(x² + C). Whenever f(x,y) splits into h(x)·g(y) like this, separation is the fastest route — no integrating factor or potential function needed.',
          best: true,
        },
        {
          id: 'de_leaf_linear',
          method: 'Linear-equation integrating factor',
          reason:
            "Try to force this into the standard linear form dy/dx + P(x)y = Q(x) and it won't go: that form needs y to appear only to the first power, but here y appears as y² — the equation is degree 2 in y, so it's a Bernoulli equation, not a linear one. (A genuine Bernoulli equation can be tamed with the substitution v = y^(1−n), but that's a longer detour this equation doesn't need — it's already separable as it stands.) Reach for the integrating-factor method only once you've confirmed the y-term is actually linear.",
        },
        {
          id: 'de_leaf_exact',
          method: 'Exact-equation method',
          reason:
            "Rewrite as M dx + N dy = 0: 2xy² dx − dy = 0, so M = 2xy² and N = −1. The exactness test asks whether ∂M/∂y = ∂N/∂x. Here ∂M/∂y = 4xy while ∂N/∂x = 0 — they agree only along x = 0 or y = 0, not identically, so the equation fails the exactness test and there's no potential function F(x,y) with F_x = M and F_y = N. Don't reach for the exactness method until ∂M/∂y and ∂N/∂x actually match everywhere, not just at isolated points.",
        },
      ],
    },
    caption:
      'Every route is walkable. Pick the one you would actually take and read why it lands where it does.',
  },
};

/** Trainers behind /theorem-wizard/:module. */
export const THEOREM_WIZARD_TRAINERS: Record<string, MethodSelectionTrainer> = {
  'linear-algebra': LINEAR_ALGEBRA,
  'vector-calculus': VECTOR_CALCULUS,
  'numerical-methods': NUMERICAL_METHODS,
  'transform-theory': TRANSFORM_THEORY,
  'graph-theory': GRAPH_THEORY,
  'differential-equations': DIFFERENTIAL_EQUATIONS,
};

/** The trainer behind /distribution-selector. */
export const DISTRIBUTION_TRAINER = DISTRIBUTIONS;

/** Everything above, for tests and any future index page. */
export const ALL_METHOD_SELECTION_TRAINERS: MethodSelectionTrainer[] = [
  LINEAR_ALGEBRA,
  VECTOR_CALCULUS,
  DISTRIBUTIONS,
  NUMERICAL_METHODS,
  TRANSFORM_THEORY,
  GRAPH_THEORY,
  DIFFERENTIAL_EQUATIONS,
];

/**
 * CONCEPT_TO_WIZARD_NODE (wizard-mistake-loop follow-up, 2026-09-03) — the
 * startAt deep-link map. Keys are `item.node_id` values as they actually
 * appear in the shipped practice-item banks (verified against
 * `data/practice-items/gate-ma-la-*.json`, `gate-ma-vector-calculus.json`,
 * `gate-ma-probability-statistics.json` — not assumed from the concept
 * graph alone), mapped to the specific `BranchNode.id` inside the matching
 * trainer's tree that presents the decision that concept's questions
 * actually test.
 *
 * Coverage is PARTIAL by design, on two different grounds:
 *
 *  - Linear algebra and vector calculus: every fork in both trees maps to
 *    a real concept id except vector-calculus's three purely foundational
 *    concepts (`vector-fields`, `divergence-curl`, `vector-algebra-basics`)
 *    and the two integral-setup concepts (`line-integrals`,
 *    `surface-integrals`) — none of those is itself a "which theorem"
 *    decision, so routing them to `vc_start`'s classification question
 *    (unchanged, the pre-existing behavior) is the correct entry point,
 *    not a gap to close.
 *
 *  - Distributions: the curriculum's concept granularity for this topic is
 *    `discrete-distributions` / `continuous-distributions` — there is no
 *    per-distribution concept id (no "poisson-distribution", etc.), so the
 *    deep link can only skip `ds_start` (count vs. measurement), not the
 *    finer forks the tree asks next (`ds_discrete`/`ds_continuous`
 *    themselves ask which distribution WITHIN that category — a student
 *    still walks that one extra question). A real limitation of today's
 *    content model, not an oversight — recorded, not silently narrowed.
 *
 * A concept absent here is not a bug: `DecisionTreeWalkthrough`'s own
 * `startAt` fails closed to the tree's true root, exactly as if no map
 * existed at all.
 */
export const CONCEPT_TO_WIZARD_NODE: Record<string, Record<string, string>> = {
  'linear-algebra': {
    determinants: 'la_invertible',
    'matrix-inverse': 'la_invertible',
    'rank-nullity': 'la_injective',
    'null-space-column-space': 'la_injective',
    'linear-transformations': 'la_injective',
    diagonalization: 'la_power',
    'cayley-hamilton': 'la_power',
    'quadratic-forms': 'la_definite',
    'positive-definite-matrices': 'la_definite',
    'spectral-theorem': 'la_definite',
  },
  'vector-calculus': {
    'greens-theorem': 'vc_plane_pick',
    'stokes-theorem': 'vc_space_pick',
    'gauss-divergence': 'vc_closed_pick',
  },
  'distribution-selector': {
    'discrete-distributions': 'ds_discrete',
    'continuous-distributions': 'ds_continuous',
  },
  // Micro-solver wave 1 (2026-09-03) — each of these trainers is a single
  // fork, so its one concept (or shared concepts, for transform-theory)
  // maps to that one node id. Trivial today, but keeping the same map
  // shape as the multi-fork trainers means a future added fork needs no
  // routing changes here — only a new map entry.
  'numerical-methods': {
    'root-finding': 'nm_root_pick',
  },
  'transform-theory': {
    'laplace-transform': 'tt_transform_pick',
    'fourier-transform': 'tt_transform_pick',
    'z-transform': 'tt_transform_pick',
  },
  'graph-theory': {
    'shortest-paths': 'gt_shortest_pick',
  },
  'differential-equations': {
    'ode-first-order': 'de_method_pick',
    'ode-exact': 'de_method_pick',
  },
};

/**
 * Resolves the `startAt` node id for a trainer + concept, or `undefined`
 * when there's no mapped fork (an unmapped concept, an unmapped trainer, or
 * no concept at all) — the caller passes `undefined` straight through to
 * `GuidedWalkthrough`/`DecisionTreeWalkthrough`, which already treats a
 * missing `startAt` as "open at the true root," so there is no separate
 * fallback branch to get wrong here.
 */
export function wizardStartNodeForConcept(
  trainerId: string,
  concept: string | null | undefined,
): string | undefined {
  if (!concept) return undefined;
  return CONCEPT_TO_WIZARD_NODE[trainerId]?.[concept];
}
