/**
 * frontend/src/generated/concept-anchors.gen.ts
 *
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Source of truth:
 *   data/registry/concept-anchors/<topic>.yml
 *
 * Regenerate:
 *   npx tsx frontend/scripts/generate-concept-anchors.ts
 *
 * Edit the YAML, then regenerate — never edit this file directly. A CI
 * drift test re-runs the codegen builder in-memory and fails the build
 * if this file is out of sync.
 *
 * Deliberately self-contained (no imports): this ships into the client
 * bundle, so it carries authored prose only — no per-student data.
 *
 * Concepts whose anchor is an honest null are absent from this map by
 * design; the renderer draws nothing for them.
 */

/** One plain sentence per concept: what this maths is FOR. */
export const CONCEPT_ANCHORS: Readonly<Record<string, string>> = {
  "analytic-functions": "Heat-sink engineers rely on this: a metal plate's interior heat is fixed by its edge heat alone.",
  "boolean-algebra": "A chip designer simplifies a circuit's expression: fewer terms mean fewer physical logic gates.",
  "cayley-hamilton": "Cayley-Hamilton turns a control system's matrix powers into one short, exact polynomial.",
  "chain-rule": "Cruise control multiplies throttle-to-RPM and RPM-to-speed rates to set its adjustment.",
  "change-of-basis": "A change-of-basis matrix lets an autopilot convert velocity from body frame to Earth frame.",
  "complex-integration": "Physicists solve a diffraction integral with no formula by bending its path into the complex plane.",
  "complex-numbers": "An AC circuit's resistance and reactance combine into one complex number, reducing it to algebra.",
  "conformal-mapping": "Aircraft designers map a wing's cross-section onto a circle, solve its airflow, then map lift back.",
  "continuity": "Self-driving cars check that a tracked pedestrian's position is continuous, never jumping frames.",
  "continuous-distributions": "A bolt sorter checks if a bolt's size falls in a range — one exact reading has zero probability.",
  "counting-principles": "An invite-code generator counts all codes, to know how many users it can invite before repeats.",
  "definite-integrals": "A smart power meter integrates your power draw all day to bill you; exported power subtracts.",
  "derivatives-basic": "A speedometer shows the derivative of distance: how fast it's changing right now.",
  "determinants": "A robot arm's software watches its motion matrix's determinant; zero means a lost direction.",
  "diagonalization": "Diagonalizing a spring-linked pair of vibrating masses' matrix decouples their tangled motion.",
  "differentiability": "A self-driving car's steering path must be differentiable, or the wheel snaps and jolts riders.",
  "discrete-distributions": "A call center uses the Poisson distribution to predict calls per minute, and staffs accordingly.",
  "divergence-curl": "Weather forecasters read a wind field for two signs: air piling up, or air starting to spin.",
  "eigenvalues": "PageRank treats the web as a matrix and ranks pages by its dominant eigenvector.",
  "euler-hamilton": "A delivery firm checks a no-repeat route instantly; touching every address has no known shortcut.",
  "fourier-series": "Power engineers split a distorted AC wave into harmonics to find which one overheats a transformer.",
  "fourier-transform": "Noise-cancelling headphones find a jet's rumble frequencies, then play them back inverted to cancel.",
  "functions-combinatorics": "A test engineer counts every way 4 requests route to 2 servers, to make sure edge cases get tested.",
  "gauss-divergence": "Engineers find charge hidden inside a sealed surface from its total outward field flow alone.",
  "gram-schmidt": "Gram-Schmidt straightens a 3D camera's rough 'up' vector so it's perpendicular to forward.",
  "graph-basics": "A social network can sanity-check its data: everyone's friend-counts must sum to an even number.",
  "graph-coloring": "A compiler colors a conflict graph to assign CPU registers; exact optimal coloring is NP-hard.",
  "graph-connectivity": "A telecom engineer finds which single cable, if cut, would split the city's fibre network in two.",
  "greens-theorem": "A wing's lift circulation can be measured along its edge, or by summing swirl over its surface.",
  "group-theory-basics": "A materials scientist classifies a crystal by rotations that leave it unchanged — a group's axioms.",
  "hypothesis-testing": "A factory trusts a new bulb design only once the observed gain is too unlikely to be random luck.",
  "implicit-differentiation": "In a sealed gas canister, implicit differentiation finds pressure's rate without solving for it.",
  "improper-integrals": "A bond paying interest forever still has a finite price: improper integrals check that convergence.",
  "inner-product-spaces": "A spectrum analyzer measures a song's bass as the inner product with a reference wave.",
  "integration-basics": "A fitness tracker integrates your calorie-burn rate every second into one daily total.",
  "integration-by-parts": "Finding a bus's average wait time means integrating time against a decaying exponential.",
  "interpolation": "Crash investigators interpolate sparse flight-recorder altitude readings into a smooth curve.",
  "inverse-laplace": "A car suspension's motion, solved in transformed form, is inverted back to a bounce-vs-time graph.",
  "joint-distributions": "An insurer studies how age and accident risk move together — the joint pattern reveals hidden risk.",
  "jordan-normal-form": "A critically-damped shock absorber's decay term comes from Jordan form, when eigenvectors repeat.",
  "laplace-applications": "Power engineers fold starting voltage and current into the transform to predict a breaker's surge.",
  "laplace-transform": "Cruise-control engineers turn a car's messy equation into algebra with this transform, then tune it.",
  "least-squares": "A GPS receiver's extra, slightly conflicting satellite readings are reconciled by least squares.",
  "limits": "A radar gun clocks instant speed as the averaging window shrinks toward zero.",
  "line-integrals": "Towing a boat along a river whose current shifts needs adding up push felt along the whole path.",
  "linear-independence": "A quadcopter loses a direction of control if two propeller thrust combinations aren't independent.",
  "linear-transformations": "A game engine rotates a character's thousands of vertices at once by multiplying each by one matrix.",
  "lu-factorization": "Bridge software factors the stiffness matrix once, then reuses it for fifty different load cases.",
  "matrix-inverse": "Decrypting multiplies by the scrambling matrix's inverse, which exists only if scrambling is unique.",
  "matrix-norms": "Simulation software checks a matrix's condition number before trusting its answer is accurate.",
  "matrix-operations": "A robot arm's shoulder-then-elbow rotation isn't elbow-then-shoulder — matrix order matters.",
  "maxima-minima": "A box designer sets the volume's derivative to zero to find the most-space dimensions.",
  "mean-value-theorems": "Average-speed cameras use the Mean Value Theorem: your speed matched the average at some instant.",
  "multiple-integrals": "A structural engineer sums density across a slab's area to find its total weight.",
  "multivariable-calculus": "A hiking app's steepness reading changes with direction; a partial derivative freezes all but one.",
  "null-space-column-space": "A robot arm dodges obstacles using joint motions in its Jacobian's null space, hand unmoved.",
  "numerical-error-analysis": "In 1991, a Patriot missile clock's rounding-error drift over 100 hours let a Scud missile through.",
  "numerical-integration": "A clinical trial integrates drug-concentration readings to estimate total exposure, setting dose.",
  "numerical-linear-algebra": "Google's PageRank ranks billions of pages by refining a guess to a system too huge to solve exactly.",
  "numerical-ode": "A flight simulator has no formula for a plane's motion, so it takes tiny steps using Runge-Kutta.",
  "ode-bernoulli": "Growth rising with population squared predicts a 'doomsday' — infinity reached by a finite date.",
  "ode-classification": "Before solving a car suspension's equation, engineers check its order, degree, and linearity first.",
  "ode-exact": "In thermodynamics, an 'exact' energy change depends only on state, like temperature, not the path.",
  "ode-first-order": "Tea cools fastest right after pouring — the rate depends only on the gap to room temperature.",
  "ode-higher-order": "A control system mixes several response modes, but engineers track only the fastest-growing one.",
  "ode-second-order-homo": "A plucked guitar string fades while ringing at pitch — decay shape set by tension and mass alone.",
  "ode-second-order-nonhomo": "Push a swing in rhythm and it climbs higher each cycle — resonance, which bridge engineers avoid.",
  "orthogonality": "Wifi splits one signal across frequency channels chosen orthogonal so none leak into another.",
  "partial-fractions": "Circuit engineers split a solved transform-space signal into fractions to read off real voltage.",
  "pde-basics": "An engine block's heat depends on position and time running — engineers place heat sinks using both.",
  "planar-graphs": "A circuit-board designer checks if every trace fits on one copper layer without crossing another.",
  "positive-definite-matrices": "A training algorithm checks its loss curvature is positive definite to confirm a dip, not a saddle.",
  "probability-basics": "A doctor uses Bayes' rule to weigh a cancer test's accuracy against how rare the disease is.",
  "product-quotient-rule": "A store's revenue is price times quantity; the product rule tracks both shifting together.",
  "propositional-logic": "A firewall rule 'if traffic matches, block it' breaks only when matching traffic still gets through.",
  "quadratic-forms": "A GPS position-error ellipse's shape comes from a quadratic form built from its error data.",
  "random-variables": "A loot-box system sums each reward's chance times its value — the average payout a player earns.",
  "rank-nullity": "Rank-nullity fixes how much of a spacecraft's state its sensors can measure versus stay hidden.",
  "recurrence-relations": "A bank computes next month's loan balance from a formula, not by replaying every past month in turn.",
  "regression-correlation": "A real-estate tool fits price against square footage — showing they move together, not causation.",
  "residue-calculus": "Filter engineers sum residues inside one loop to find the noise power the filter lets through.",
  "root-finding": "A loan calculator finds your rate by guessing, checking the error, and correcting repeatedly.",
  "sampling-distributions": "An election poll's margin of error comes from how a sample average shifts across different samples.",
  "sequences": "A calculator's square-root method generates guesses that crowd closer to the true answer.",
  "series": "A bouncing ball's infinite bounces still travel a finite total distance.",
  "sets-relations": "A database groups customers into zip-code classes; the matching rule must behave consistently.",
  "shortest-paths": "A maps app settles the nearest city first to find cheapest routes; it fails if costs go negative.",
  "spectral-theorem": "The spectral theorem guarantees PCA's covariance eigen-directions are always perpendicular.",
  "stokes-theorem": "A turbine's spin is measured along its blade's rim, or by summing swirl through the disk it sweeps.",
  "surface-integrals": "A solar panel's power output follows the cosine of its tilt angle away from facing the sun.",
  "svd": "A photo compresses to a tenth its size by keeping only its largest SVD singular values.",
  "symmetric-matrices": "A bridge's stiffness matrix is symmetric: push A, measure sag at B equals push B, measure sag at A.",
  "systems-of-equations": "Solving a circuit's Kirchhoff's-law equations shows if every current is fixed, free, or impossible.",
  "taylor-laurent": "Filter designers expand a system as a Laurent series to test its stability near each trouble point.",
  "trace": "A positive trace on a structure's system matrix guarantees vibration grows, not dies out.",
  "trees": "A power company wires new substations with exactly enough cable to reach each one and no more.",
  "vector-algebra-basics": "Two cranes pulling one load at different angles combine forces like a parallelogram, not plain sums.",
  "vector-fields": "A weather map attaches speed and direction to every point; walk inland and the wind arrows swing.",
  "vector-spaces": "Mixing songs adds their waveforms and volume scales them — the same rules that govern arrows.",
  "z-transform": "A phone's audio chip only sees numbers; the z-transform designs a filter run one sample at a time.",
};

/** The sentence for a concept, or null when none is authored. */
export function conceptAnchor(conceptId: string | undefined): string | null {
  if (!conceptId) return null;
  return CONCEPT_ANCHORS[conceptId] ?? null;
}
