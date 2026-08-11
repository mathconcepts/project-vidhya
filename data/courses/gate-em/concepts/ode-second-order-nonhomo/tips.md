# Teaching Tips: Second Order Non-Homogeneous ODEs

## Common Student Errors
- **Forgetting to solve the homogeneous part first:** Students jump to finding $y_p$ without establishing $y_h$. You MUST know $y_h$ to guess the correct form for $y_p$ (especially to detect resonance). Always start with the homogeneous solution.
- **Missing resonance and not multiplying by $x$:** If the forcing term $f(x)$ is a homogeneous solution (e.g., $f(x) = e^{rx}$ and $r$ is a characteristic root), you MUST multiply your usual guess by $x$ (or higher powers for repeated roots). Forgetting this leads to an unsolvable system for the coefficients.
- **Confusing "undetermined coefficients" with "variation of parameters":** Both find $y_p$, but they're different methods. Undetermined coefficients works for simple $f(x)$ (polynomials, exponentials, trig). Variation of parameters is more general but slower. GATE exams reward speed, so use undetermined coefficients first.

## GATE Question Pattern
GATE typically presents a second-order non-homogeneous ODE and asks you to: (1) classify the homogeneous part, (2) propose the form of $y_p$ without computing it (testing recognition of resonance), or (3) solve the full problem with initial conditions. Watch out for disguised resonance: $\frac{d^2y}{dx^2} - 4y = e^{2x}$ has $f(x) = e^{2x}$, and $r = 2$ is a characteristic root, so resonance applies—use $y_p = Axe^{2x}$, not just $y_p = Ae^{2x}$. Problems mixing exponential and polynomial forcing (e.g., $f(x) = x e^{3x}$) are also common; the guess must include all terms up to that power.

## Speed Tricks for MCQs
- **Resonance flag shortcut:** Write down the characteristic roots immediately. Then scan the forcing term: if it matches one of the roots, multiply your guess by $x$. If it matches a repeated root, multiply by $x^2$. Instant accuracy without second-guessing.
- **Coefficient-matching parallelization:** When using undetermined coefficients, separate the equation into independent conditions for each function type (e.g., $\sin(x)$ vs $\cos(x)$ coefficients). Write them as a system and solve simultaneously.
- **Particular solution verification:** Once you find $y_p$, substitute it back into the original ODE to verify. This takes 30 seconds and catches ~90% of arithmetic errors.

## Must-Memorize Formulas / Results
- **General solution:** $y(x) = y_h(x) + y_p(x)$, where $y_h$ solves the homogeneous equation and $y_p$ is any particular solution.
- **Form guessing for undetermined coefficients:**
  | $f(x)$ | $y_h$ contains? | Guess $y_p$ |
  |---|---|---|
  | Constant $P_n(x)$ | No $e^0$ term (always true) | $A$ (if $0 \notin \text{roots}$) |
  | Polynomial $P_n(x)$ | No polynomial | $x^m Q_n(x)$ where $m = $ multiplicity of root 0 |
  | $e^{\alpha x} P_n(x)$ | No $e^{\alpha x}$ | $x^m e^{\alpha x} Q_n(x)$ where $m = $ mult. of $\alpha$ |
  | $\cos(\beta x)$ / $\sin(\beta x)$ | No $\cos(\beta x), \sin(\beta x)$ | $A\cos(\beta x) + B\sin(\beta x)$ |
  | Same as above | Contains both | $x[A\cos(\beta x) + B\sin(\beta x)]$ |
- **Resonance condition:** Multiply the guess by $x^m$ if the forcing term (or its exponential envelope) matches a characteristic root of multiplicity $m$.
- **Variation of parameters formula (for reference, slower in exams):**
  $$y_p = -y_1 \int \frac{y_2 f}{W} dx + y_2 \int \frac{y_1 f}{W} dx$$
  where $W = y_1 y_2' - y_1' y_2$ is the Wronskian, and $y_1, y_2$ are the homogeneous solutions.
