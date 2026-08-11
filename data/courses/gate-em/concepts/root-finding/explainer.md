# Root Finding

> GATE Engineering Mathematics | Numerical Methods | high frequency | difficulty: 0.4

## Intuition First

Imagine you're hiking downhill and need to find the exact point where the ground crosses sea level. You can't solve $f(x) = 0$ by hand, so you take small steps, getting closer each time—that's root finding. Each method is a different hiking strategy: some take slow steady steps (bisection), others sprint toward the answer (Newton-Raphson).

## Core Definition

**Newton-Raphson Method**: Given a differentiable function $f(x)$, the iterative formula is:

$$x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}$$

Starting from an initial guess $x_0$, this sequence converges to a root $r$ where $f(r) = 0$, provided $f'(r) \neq 0$ and $x_0$ is sufficiently close to $r$. The convergence is **quadratic**: error at step $n+1$ is proportional to the square of error at step $n$.

## What Happens (Worked Example)

**Problem**: Find the root of $f(x) = x^3 - 2x - 5$ near $x_0 = 2$ using Newton-Raphson.

**Computation**:
- $f'(x) = 3x^2 - 2$
- At $x_0 = 2$: $f(2) = 8 - 4 - 5 = -1$, $f'(2) = 12 - 2 = 10$
- Iteration 1: $x_1 = 2 - \frac{-1}{10} = 2.1$
- At $x_1 = 2.1$: $f(2.1) = 9.261 - 4.2 - 5 = 0.061$, $f'(2.1) = 13.23 - 2 = 11.23$
- Iteration 2: $x_2 = 2.1 - \frac{0.061}{11.23} \approx 2.0946$
- Iteration 3: $x_3 \approx 2.0946$ (converged to ~4 decimal places in just 3 iterations)

**Why it works**: The tangent line at $x_n$ provides a linear approximation to $f(x)$ locally. The formula $x_{n+1}$ is simply the x-intercept of this tangent line. Since the tangent closely hugs the curve near $x_n$, we jump almost directly toward the root. Geometrically: each iteration is a secant-to-tangent refinement that quadratically shrinks the error.

## GATE MA Relevance

> **Why it matters in GATE MA:** Root-finding appears in 2–3% of papers as 1–2 mark MCQs testing convergence rate comparison, iteration formulas for Newton-Raphson or bisection, and error estimation for fixed-point methods. Questions typically ask: "Which method converges fastest?" or "Find $x_2$ given $x_0$ and $f$." High-frequency, low-computation-burden topic.
