# Interpolation

> GATE Engineering Mathematics | Numerical Methods | high frequency | difficulty: 0.5

## Intuition First

Imagine you have 3 GPS waypoints of a car's position but want to estimate where it was at a moment in between. Interpolation is the art of drawing a smooth curve through known data points and reading off values at new locations. Lagrange interpolation glues polynomial pieces smoothly; Newton forward/backward formulas use a stepping pattern that's faster to compute.

## Core Definition

**Lagrange Interpolation Polynomial**: Given $n+1$ distinct points $(x_0, y_0), (x_1, y_1), \ldots, (x_n, y_n)$, there exists a unique polynomial $P_n(x)$ of degree at most $n$ such that $P_n(x_i) = y_i$ for all $i$. The Lagrange form is:

$$P_n(x) = \sum_{i=0}^{n} y_i L_i(x), \quad L_i(x) = \prod_{j=0, j \neq i}^{n} \frac{x - x_j}{x_i - x_j}$$

Each Lagrange basis polynomial $L_i(x)$ equals 1 at $x_i$ and 0 at all other nodes, ensuring $P_n$ passes through every data point. The interpolant is unique; different formulas (Lagrange, Newton, Hermite) are algebraically equivalent.

## What Happens (Worked Example)

**Problem**: Interpolate the points $(0, 1)$, $(1, 2)$, $(2, 5)$ using Lagrange formula, then estimate $P(0.5)$.

**Computation**:

The Lagrange basis polynomials are:
$$L_0(x) = \frac{(x-1)(x-2)}{(0-1)(0-2)} = \frac{(x-1)(x-2)}{2}$$
$$L_1(x) = \frac{(x-0)(x-2)}{(1-0)(1-2)} = \frac{x(x-2)}{-1} = -x(x-2) = -x^2 + 2x$$
$$L_2(x) = \frac{(x-0)(x-1)}{(2-0)(2-1)} = \frac{x(x-1)}{2}$$

So $P_2(x) = 1 \cdot L_0(x) + 2 \cdot L_1(x) + 5 \cdot L_2(x)$.

At $x = 0.5$:
- $L_0(0.5) = \frac{(0.5-1)(0.5-2)}{2} = \frac{(-0.5)(-1.5)}{2} = 0.375$
- $L_1(0.5) = -0.5(0.5-2) = -0.5(-1.5) = 0.75$
- $L_2(0.5) = \frac{0.5(0.5-1)}{2} = \frac{0.5(-0.5)}{2} = -0.125$

$P_2(0.5) = 1(0.375) + 2(0.75) + 5(-0.125) = 0.375 + 1.5 - 0.625 = 1.25$

**Why it works**: Each basis function is zero at the non-associated nodes and one at its own node. This "partition of unity" property means: at each data point, only one term contributes (the $y_i$ value), and at intermediate points, they blend smoothly. Geometrically, you're constructing a quadratic curve passing through three points with unique slope and curvature at each point.

## GATE MA Relevance

> **Why it matters in GATE MA:** Interpolation appears in 2–3% of GATE papers, typically as 1–2 mark MCQs. Common question types: (1) "Given 3 points, find $P(x_*)$ using Lagrange"; (2) "Which interpolation method is best for equally-spaced points?" (Newton forward); (3) "Find the error bound in interpolation." High frequency because it's a gateway to numerical integration (Simpson's rule is built on parabolic interpolation).
