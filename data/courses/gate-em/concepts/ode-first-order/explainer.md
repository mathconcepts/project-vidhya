# First Order ODEs
> GATE Engineering Mathematics | Differential Equations | high frequency | difficulty: 0.4

## Intuition First
Imagine water draining from a tank — the rate at which it drains depends on how much water is left. A first-order ODE captures this "how it changes depends on what it is" relationship in one equation.

## Core Definition
**Standard First-Order ODE Form**: An equation of the form $\frac{dy}{dx} = f(x, y)$ where the derivative of $y$ with respect to $x$ depends on both $x$ and $y$. The solution $y(x)$ is a family of curves, each determined by an initial condition $y(x_0) = y_0$.

**Separable ODE** (most common): If the equation can be written as $\frac{dy}{dx} = g(x) h(y)$, separate variables:
$$\frac{dy}{h(y)} = g(x) \, dx$$
Integrate both sides to find the solution.

## What Happens (Worked Example)
Label: "**What happens:**"

Consider $\frac{dy}{dx} = 2xy$ with initial condition $y(0) = 1$.

**Step 1:** Separate variables:
$$\frac{dy}{y} = 2x \, dx$$

**Step 2:** Integrate both sides:
$$\int \frac{dy}{y} = \int 2x \, dx$$
$$\ln|y| = x^2 + C$$

**Step 3:** Exponentiate to solve for $y$:
$$|y| = e^{x^2 + C} = Ae^{x^2}$$
where $A = e^C > 0$.

**Step 4:** Apply initial condition $y(0) = 1$:
$$1 = A e^{0} = A$$
So $A = 1$.

**Final Solution:** $y = e^{x^2}$

This is a bell curve that grows exponentially as $|x|$ increases — geometrically, it represents an exponential trajectory that starts at height 1 and spreads outward.

Label: "**Why it works:**"
Separation of variables works because we rearrange to isolate all $y$-terms on one side and all $x$-terms on the other, then integrate. The initial condition anchors the arbitrary constant $C$, selecting one specific curve from the entire family of solutions.

## GATE MA Relevance
> **Why it matters in GATE MA:** First-order ODEs account for ~15% of GATE MA questions (5-7 marks). Questions are typically 1-mark MCQs or 2-mark NATs asking you to solve a specific separable ODE or verify a given solution. The core skill is recognizing when to use separation of variables and performing the integration correctly under time pressure.
