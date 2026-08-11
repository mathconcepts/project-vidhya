# Teaching Tips: Continuity

## Common Student Errors

- **Thinking removable discontinuity = continuous:** A removable discontinuity means the function is currently NOT continuous, but the discontinuity can be "fixed" by redefining the function. The original function is still discontinuous.
- **Confusing three types of discontinuity:** Students mix up jump (left limit $\neq$ right limit), removable (limit exists but $\neq$ function value), and infinite (limit is $\pm\infty$).
- **Forgetting to check all three conditions:** Students check only the limit, forgetting that $f(a)$ must be defined AND equal to the limit.

## GATE Question Pattern

GATE asks: (1) Identify the type of discontinuity at a point (MCQ). (2) Find the value of a parameter that makes a piecewise function continuous (NAT). (3) Use the Intermediate Value Theorem on a continuous function (rare, 2-mark MCQ). Piecewise functions are common; always check continuity at the "corner."

## Speed Tricks for MCQs

- **Three-check shortcut:** To test continuity at $a$, ask: (1) Is $f(a)$ defined? (2) Does $\lim_{x \to a} f(x)$ exist? (3) Are they equal? If all yes, continuous; if any no, not continuous.
- **Piecewise function corner rule:** For piecewise functions defined by different formulas on each piece, discontinuities only occur at the boundaries. Always check where the formula changes.
- **Removable vs. infinite:** If the limit exists (even if $\neq f(a)$ or $f(a)$ undefined), it's removable. If the limit is $\pm\infty$, it's infinite.

## Must-Memorize Formulas / Results

- **Continuity definition:** $f$ is continuous at $a$ iff $\lim_{x \to a} f(x) = f(a)$ (and the limit exists).
- **Removable discontinuity:** $\lim_{x \to a} f(x)$ exists but $\neq f(a)$ or $f(a)$ undefined.
- **Jump discontinuity:** $\lim_{x \to a^-} f(x) \neq \lim_{x \to a^+} f(x)$.
- **Infinite discontinuity:** $\lim_{x \to a^{\pm}} f(x) = \pm\infty$.
- **Composite of continuous functions:** If $f$ and $g$ are continuous, so are $f + g$, $f \cdot g$, $f/g$ (where $g \neq 0$), and $f \circ g$.
- **Intermediate Value Theorem:** If $f$ is continuous on $[a,b]$ and $k$ is between $f(a)$ and $f(b)$, then $\exists c \in (a,b)$ with $f(c) = k$.
