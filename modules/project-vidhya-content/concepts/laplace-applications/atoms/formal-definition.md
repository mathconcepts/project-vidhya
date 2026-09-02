---
id: laplace-applications.formal-definition
concept_id: laplace-applications
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**Laplace Method for Solving ODEs**: To solve an ODE like $\frac{d^2y}{dt^2} + 3\frac{dy}{dt} + 2y = f(t)$ with initial conditions $y(0) = y_0, y'(0) = y_1$:

1. **Transform:** Take the Laplace transform of both sides.
2. **Substitute initial conditions:** Use $\mathcal{L}\{y'\} = sY(s) - y(0)$ and $\mathcal{L}\{y''\} = s^2Y(s) - sy(0) - y'(0)$.
3. **Solve algebraically:** Rearrange to get $Y(s) = \frac{\text{[numerator]}}{\text{[denominator]}}$ (a rational function).
4. **Inverse transform:** Use partial fractions to decompose $Y(s)$ and match standard pairs.

**Convolution Theorem**: If $y(t) = \int_0^t x(\tau) h(t-\tau) d\tau$ (convolution of input and impulse response), then in the $s$-domain:

$$Y(s) = X(s) \cdot H(s)$$

Multiplication in the $s$-domain corresponds to convolution in the time domain. This is profound: complex time-domain operations become simple $s$-domain multiplication.

**Geometric interpretation:** Solving an ODE via Laplace is a coordinate transformation: the time-domain ODE (a differential equation) becomes an algebraic equation in $s$-space (multiplication and addition), which is trivial. Poles of $Y(s)$ encode the system's natural response modes (exponentials and sinusoids); their locations dictate stability.

**When to reach for it:** the Laplace method is the right tool whenever the ODE is linear with constant coefficients and initial conditions are given as numbers — those numbers fold into $Y(s)$ during Step 2, not afterward. The tempting alternative, undetermined coefficients (homogeneous solution plus a guessed particular form), reaches the same answer, but it defers solving for the arbitrary constants to a separate step at the end using the initial conditions; Laplace bakes that bookkeeping into the algebra as it goes, which is why it wins on anything past a first-order equation.
