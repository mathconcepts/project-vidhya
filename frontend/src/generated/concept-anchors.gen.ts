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
  "analytic-functions": "A metal plate's interior temperature is pinned down completely by its edge temperature alone — the exact rigidity analytic functions have, and heat-sink engineers rely on it directly.",
  "boolean-algebra": "A chip designer simplifies a circuit's boolean expression before fabrication — fewer terms mean fewer physical logic gates on the silicon, which means a cheaper, faster, cooler-running chip.",
  "cayley-hamilton": "A control engineer predicting how a system evolves over time needs its matrix exponential; Cayley-Hamilton turns that infinite series into a short, exact polynomial in the matrix alone.",
  "chain-rule": "A cruise control's throttle sets engine RPM, and RPM sets road speed — the system multiplies each link's own rate of change to know how far to adjust the throttle.",
  "change-of-basis": "An aircraft's autopilot senses velocity in the plane's body frame but must fly a route in Earth coordinates; a change-of-basis matrix converts one reading into the other.",
  "complex-integration": "Physicists computing a light-diffraction integral that has no elementary formula deform the path into the complex plane instead; clear of any singularity, it gives the same real answer.",
  "complex-numbers": "Electrical engineers analysing an AC circuit write resistance and reactance together as one complex number, so a circuit mixing resistors, capacitors, and coils reduces to ordinary algebra.",
  "conformal-mapping": "Aircraft designers compute a wing's lift by mapping its odd cross-section onto a plain circle, where the airflow math is easy, then carrying the answer back onto the real wing.",
  "continuity": "Self-driving cars assume a tracked pedestrian's position never jumps between camera frames; testing that assumption is exactly checking continuity, before any motion-prediction math is trusted.",
  "continuous-distributions": "A factory's bolt-sorting machine never asks the chance a bolt is exactly 10.000 mm — just the chance it falls in range, since one exact reading carries zero probability.",
  "counting-principles": "A website that hands out 6-character invite codes counts every possible combination first — that count decides exactly how many users it can invite before codes must start repeating.",
  "definite-integrals": "A smart electricity meter integrates your power draw all day to bill you — power exported back to the grid counts negative, subtracting instead of adding to the total.",
  "derivatives-basic": "A car's speedometer doesn't show your total distance travelled — it shows the derivative, how fast that distance is changing at this exact instant.",
  "determinants": "A robot arm's control software constantly checks one number, the determinant of its motion matrix; the instant it hits zero, the arm has lost a direction it can move in.",
  "diagonalization": "Two vibrating masses linked by a spring have equations tangled together; diagonalizing their system matrix swaps to new coordinates where each mass moves as if the other weren't there.",
  "differentiability": "A self-driving car's planned path being continuous stops it teleporting, but only being differentiable too stops the steering wheel from snapping to a new angle instantly, jolting the passengers.",
  "discrete-distributions": "A call center's staffing software uses the Poisson distribution to predict how many calls will likely arrive in the next minute, so it schedules just enough operators without wildly overstaffing.",
  "divergence-curl": "A weather map's wind field lets forecasters check two things: is air piling up or draining away, and is it starting to spin — two independent warning signs, checked separately.",
  "eigenvalues": "Google's original ranking algorithm treats the web as one giant matrix and finds its dominant eigenvector — the one direction every page's importance settles into after repeated link-following.",
  "euler-hamilton": "A delivery company can instantly check whether one driver can cover every street without repeating a road, but finding a route touching every address exactly once has no known shortcut.",
  "fourier-series": "Power-quality engineers break a distorted, repeating AC waveform into its harmonics to find the exact one overheating a transformer, without ever touching the transformer itself.",
  "fourier-transform": "Noise-cancelling headphones work out which frequencies a jet engine's non-repeating rumble is made of, then play exactly those back inverted so the two waveforms cancel in your ear.",
  "functions-combinatorics": "A test engineer counts every way 4 requests can be routed to 2 servers with neither left idle, using this counting rule, to make sure that edge case gets tested.",
  "gauss-divergence": "An electric field's total outward flow through any sealed surface exactly equals the charge trapped inside — engineers use this to find a hidden charge without tracing the field everywhere.",
  "gram-schmidt": "A 3D camera is given a forward direction and a rough 'up' guess that isn't quite perpendicular; Gram-Schmidt straightens the up vector so the camera's axes stay at right angles.",
  "graph-basics": "A social network can instantly sanity-check its own data: the total of everyone's friend-counts must come out even, or some connection was recorded on only one side.",
  "graph-coloring": "A compiler assigns program variables to a limited set of CPU registers by coloring a conflict graph, using fast heuristics since finding the true minimum number of colors is NP-hard.",
  "graph-connectivity": "A telecom engineer tests a fibre network by asking which single cable, if cut, would split the city into two disconnected halves — that cable gets duplicated first.",
  "greens-theorem": "An aircraft wing generates lift because air circulates around it — that circulation is measured either along the wing's edge, or by summing swirl across its surface; both totals agree.",
  "group-theory-basics": "A materials scientist classifies a crystal's structure by which rotations and reflections leave it looking unchanged — the rules those symmetries obey are exactly a group's defining axioms.",
  "hypothesis-testing": "A factory testing a new bulb design computes the chance an observed gap is pure random luck, and only trusts the design once that chance is small enough.",
  "implicit-differentiation": "In a sealed gas canister, pressure and volume are tangled in one equation; implicit differentiation finds how fast pressure changes as volume changes, without solving for pressure first.",
  "improper-integrals": "A bond paying interest forever still has a finite price today — improper integrals check whether an endless payment stream adds to a finite total, or blows up.",
  "inner-product-spaces": "A spectrum analyzer measures how much bass a song carries as the inner product of its sound wave with a reference wave — the recipe that measures angle between arrows.",
  "integration-basics": "A fitness tracker doesn't measure calories burned directly — it measures your burn rate every second and integrates it, adding up all those instants into one final calorie count.",
  "integration-by-parts": "Working out the average wait for a randomly-arriving bus means integrating time times a decaying exponential — precisely the product integration by parts exists to solve.",
  "interpolation": "An aircraft's flight recorder logs altitude once every few seconds — accident investigators use interpolation to build a smooth curve through those points, estimating where the plane was in between.",
  "inverse-laplace": "After solving a car suspension's motion equation in transformed form, engineers invert it back to get the actual bounce-versus-time graph they can watch happen on a test rig.",
  "joint-distributions": "An insurer pricing a policy studies how a driver's age and accident risk move together, not each alone — the joint pattern can reveal risks that neither factor shows alone.",
  "jordan-normal-form": "A critically-damped shock absorber's motion has a decaying term plain eigenvectors can't explain; that term comes from the repeated-eigenvalue structure Jordan form falls back on when diagonalization runs short.",
  "laplace-applications": "Power engineers modelling the instant a circuit breaker switches on fold the exact starting voltage and current into the transform, predicting the surge before the switch is ever thrown.",
  "laplace-transform": "Control engineers designing a car's cruise-control system turn its messy differential equation into simple algebra with this transform, so the response can be tuned before any road test.",
  "least-squares": "A GPS receiver hears more satellites than it needs, and none quite agree because of tiny errors; least squares finds the one position that best fits every reading at once.",
  "limits": "A radar gun estimates a car's speed at this instant by tracking what the average speed approaches as the measurement window shrinks toward zero, never quite reaching it.",
  "line-integrals": "Towing a boat along a river whose current shifts direction and strength at every bend needs more than force times distance — add up the push felt along the path.",
  "linear-independence": "A quadcopter's four propellers must produce thrust combinations that are linearly independent; if two of them turn out to be duplicates, one direction of motion becomes impossible to control.",
  "linear-transformations": "A video game engine rotates or shears a 3D character by multiplying every one of its thousands of vertices by the same matrix — one operation moves the whole model.",
  "lu-factorization": "A structural-engineering program analyzing a bridge under fifty load cases factors the stiffness matrix into two triangular pieces once, then reuses it for every case instead of re-solving each time.",
  "matrix-inverse": "Encrypting a message multiplies its plain text by a scrambling matrix; decrypting multiplies by the inverse, which exists only when no two messages could ever scramble to the same result.",
  "matrix-norms": "Engineering simulation software checks one number, the condition number, before trusting its answer; a large value warns that a tiny input error could blow up into a wildly wrong result.",
  "matrix-operations": "A robot arm combines two joint rotations by multiplying their matrices; reverse the order and the hand lands somewhere different — shoulder-then-elbow is not the same motion as elbow-then-shoulder.",
  "maxima-minima": "A shipping company designing a box with a fixed amount of cardboard sets the volume's derivative to zero to find the dimensions that pack in the most space.",
  "mean-value-theorems": "Average-speed cameras clock your entry and exit time on a highway stretch — the Mean Value Theorem guarantees your speed matched that average at some exact instant in between.",
  "multiple-integrals": "A structural engineer finds a slab's total weight by adding density times tiny patches of area across its whole surface — accumulating across two directions at once, not just one.",
  "multivariable-calculus": "A hiking app's steepness reading for a hillside changes with the direction you walk — a partial derivative freezes every direction but one to answer just that.",
  "null-space-column-space": "A robot arm with spare joints can move some of them without shifting its hand — that motion lives in the Jacobian's null space, letting engineers dodge obstacles mid-task.",
  "numerical-error-analysis": "In 1991, a Patriot missile battery's clock accumulated a tiny rounding error over 100 hours — by then the drift was large enough to miss an incoming Scud missile.",
  "numerical-integration": "A clinical trial estimates a drug's total exposure in the blood by numerically integrating concentration readings taken every few hours — that computed area sets the next trial dose.",
  "numerical-linear-algebra": "Google's original PageRank algorithm ranks billions of web pages by solving one huge system of linear equations — too large for exact elimination, so it refines a guess repeatedly instead.",
  "numerical-ode": "A flight simulator's physics engine has no closed-form formula for a plane's motion under real air and engine forces, so it steps forward in tiny time increments using Runge-Kutta.",
  "ode-bernoulli": "Some population models assume growth rises with the population squared — solving that equation with this substitution predicts a genuine 'doomsday': population reaching infinity by a specific finite date.",
  "ode-classification": "Before an engineer can solve a car suspension's governing equation, they check its order, degree, and linearity first — guess any of the three wrong, and the method fails outright.",
  "ode-exact": "In thermodynamics, checking whether an energy change is 'exact' tells engineers whether a quantity depends only on a system's current state, like temperature, or on the path taken, like heat.",
  "ode-first-order": "A hot cup of tea cools fastest right after pouring and slows as it nears room temperature — the cooling rate depends only on how far it has to fall.",
  "ode-higher-order": "A control system's output mixes several response modes at once, but engineers track only the fastest-growing one for its long-term behaviour — every slower mode fades to irrelevance regardless.",
  "ode-second-order-homo": "A plucked guitar string fades while still ringing at its pitch — with nothing pushing it after the pluck, that shape is decided by the string's tension and mass alone.",
  "ode-second-order-nonhomo": "Push a swing in time with its rhythm and it climbs higher every cycle — that's resonance, the effect bridge and machine engineers must design against so vibrations don't grow.",
  "orthogonality": "Wifi and 4G split one signal across many frequency channels chosen to be orthogonal, so however they overlap in time, one channel's signal never leaks energy into another's.",
  "partial-fractions": "Engineers analyzing a circuit's response solve it in transform space, then break the tangled result into simple fractions to read off the actual voltage signal over time.",
  "pde-basics": "An engine block's temperature depends on where you measure and how long it has run — engineers track position and time together to design heat sinks that cool fast enough.",
  "planar-graphs": "A circuit-board designer checks whether every trace between components can be drawn on one copper layer without crossings; if not, the board needs an extra layer or a jumper wire.",
  "positive-definite-matrices": "A training algorithm checks whether the matrix describing its loss's curvature is positive definite; only then is it sure it landed in a dip, not on a saddle.",
  "probability-basics": "A doctor doesn't trust a positive cancer-screening result alone — Bayes' rule combines the test's accuracy with how rare the disease is, to work out how likely the diagnosis is.",
  "product-quotient-rule": "A store's revenue is price times quantity sold, and both shift as a sale is adjusted — the product rule tracks the combined effect, not just multiplying their two rates.",
  "propositional-logic": "A firewall rule 'if traffic matches this pattern, block it' is broken only by matching traffic that still gets through; traffic that never matches breaks nothing, whatever happens to it.",
  "quadratic-forms": "A GPS receiver's position error forms an ellipse, not a circle, because some directions are noisier than others; the quadratic form built from the error data sets that ellipse's shape.",
  "random-variables": "A mobile game's loot-box system assigns a fixed chance to each reward, then multiplies chance by value and adds them up — the average a player actually earns per box.",
  "rank-nullity": "A spacecraft's sensors can measure some combinations of its internal state but are structurally blind to others; rank-nullity fixes exactly how much is measurable and how much stays permanently hidden.",
  "recurrence-relations": "A bank's loan-repayment system computes next month's outstanding balance directly from a formula, instead of replaying every past month's interest calculation one step at a time back to day one.",
  "regression-correlation": "A real-estate tool fits a line through sale prices against square footage to predict a new home's value — the fit shows they move together, not that footage sets price.",
  "residue-calculus": "Communication engineers computing how much noise power a filter lets through add up the residues trapped inside one loop, multiply by a fixed constant, and read off the exact number.",
  "root-finding": "A bank's loan calculator finds the interest rate matching your payment by guessing, checking how far off it is, and correcting — since no formula solves for rate directly.",
  "sampling-distributions": "An election poll surveys a few thousand voters, then reports a margin of error — built from how much a sample average shifts across different few-thousand-voter samples.",
  "sequences": "A calculator finding a square root repeats one formula, generating a sequence of guesses that crowd closer and closer to the true answer without ever landing on it.",
  "series": "A bouncing ball loses a fixed fraction of height each bounce; it takes infinitely many bounces, yet the total distance travelled adds up to one finite number.",
  "sets-relations": "A database groups customer records into equivalence classes by matching zip code before running a report — the matching rule must behave consistently or some records land in two groups.",
  "shortest-paths": "A maps app computes the cheapest route across road-cost estimates by settling the cheapest reachable city first — a method that only works because travel costs are never negative.",
  "spectral-theorem": "PCA, used to compress datasets, finds a covariance matrix's eigen-directions; the spectral theorem guarantees those directions always come out mutually perpendicular with real spread values, for any dataset at all.",
  "stokes-theorem": "A wind turbine's spin is measured either along the blade's rim, or by summing the swirl passing through the disk it sweeps — both give exactly the same answer.",
  "surface-integrals": "A solar panel catches the most sunlight facing the sun, less as it tilts — the power gathered follows the cosine of the tilt angle, dropping slowly, then sharply.",
  "svd": "A photo can shrink to a tenth of its file size and look right, because SVD ranks its structure by singular value; keep the largest few and discard the rest.",
  "symmetric-matrices": "A bridge's stiffness matrix is always symmetric because pushing point A and measuring the sag at B gives the same number as pushing B and measuring the sag at A.",
  "systems-of-equations": "An engineer writes Kirchhoff's laws for a circuit as one system of equations; solving it shows whether every current is uniquely fixed, several solutions work, or the wiring is impossible.",
  "taylor-laurent": "Digital filter designers checking a system's stability expand it as a Laurent series around each trouble point; which ring that series converges in decides whether the filter can be built.",
  "trace": "A positive diagonal sum on a structure's system matrix guarantees its vibration grows instead of dying out — engineers rule a design out on that number, before computing any frequency.",
  "trees": "A power company wiring new substations lays exactly enough cable to reach every one and no more — one extra link only adds cost, and one fewer strands a substation.",
  "vector-algebra-basics": "Two cranes lifting one load from different angles can't add their pulling forces like plain numbers — the combined force follows a parallelogram, smaller than the sum unless pulls align.",
  "vector-fields": "A weather map attaches an arrow — speed and direction together — to every point, unlike a temperature map's plain numbers; walk inland from the coast and the arrows swing.",
  "vector-spaces": "Mixing two songs adds their waveforms; raising the volume scales them — sound recordings obey the same addition-and-scaling rules as arrows, so the same algebra tools apply to both.",
  "z-transform": "A smartphone's audio chip never sees a continuous wave, only a stream of numbers; the z-transform lets engineers design the filter recipe that runs one sample at a time.",
};

/** The sentence for a concept, or null when none is authored. */
export function conceptAnchor(conceptId: string | undefined): string | null {
  if (!conceptId) return null;
  return CONCEPT_ANCHORS[conceptId] ?? null;
}
