# Teaching Tips: First Order ODEs

## Common Student Errors
- **Forgetting the constant of integration ($C$):** Many students write $\ln y = 3x$ and jump to $y = e^{3x}$, missing the $+C$ inside the exponent. The correct form is $y = Ae^{3x}$ where $A = e^C$.
- **Misapplying initial conditions:** Students find the general solution but then fail to substitute the initial condition correctly, or forget to solve for $C$ before claiming the answer is complete.
- **Assuming separation is always possible:** Not every first-order ODE is separable. For example, $\frac{dy}{dx} = x + y$ cannot be separated—these require integrating factors or other methods.

## GATE Question Pattern
GATE typically asks you to solve a separable ODE and find a particular solution by applying an initial condition, or to verify that a given function is a solution to a provided ODE. Watch out for questions that disguise the separation step (e.g., asking for $y^2$ instead of $y$, or appearing to involve trigonometric or logarithmic expressions). A common trap is asking for $y(x_0)$ at a specific point after you've found the general solution—make sure you substitute correctly.

## Speed Tricks for MCQs
- **Verify by differentiation:** If unsure, differentiate the given answer choices and check which one satisfies the original ODE. This is faster than solving from scratch under time pressure.
- **Initial condition elimination:** Quickly scan the options and eliminate any that don't satisfy the initial condition $y(x_0) = y_0$ before bothering with the full verification.
- **Pattern recognition:** Separable ODEs with $y$ on one side and $x$ on the other almost always separate cleanly. Recognize patterns like $\frac{dy}{dx} = ky$ (exponential), $\frac{dy}{dx} = \frac{x}{y}$ (implicit curves), and reach for standard integrals.

## Must-Memorize Formulas / Results
- **Separable form solution:** If $\frac{dy}{dx} = g(x)h(y)$, then $\int \frac{dy}{h(y)} = \int g(x) \, dx + C$.
- **Exponential ODE:** $\frac{dy}{dx} = ky \Rightarrow y = Ae^{kx}$ (exponential growth if $k > 0$, decay if $k < 0$).
- **Linear integrating factor:** For $\frac{dy}{dx} + P(x)y = Q(x)$, multiply by $\mu(x) = e^{\int P(x) \, dx}$.
- **Standard integrals for separation:**
  - $\int \frac{dy}{y} = \ln|y| + C$
  - $\int \frac{dy}{a^2 + y^2} = \frac{1}{a} \arctan\left(\frac{y}{a}\right) + C$
  - $\int \frac{dy}{\sqrt{a^2 - y^2}} = \arcsin\left(\frac{y}{a}\right) + C$
