# Exact Equations
> GATE Engineering Mathematics | Differential Equations | medium frequency | difficulty: 0.5

## Intuition First
Imagine a landscape where the level curves (contours) represent solutions to a differential equation. An exact equation is special: its solution is hidden in the level curves of a function $F(x, y)$ that can be constructed directly from the coefficients of the equation.

## Core Definition
**Exact Equation Standard Form**: An equation of the form
$$M(x, y) \, dx + N(x, y) \, dy = 0$$
is **exact** if there exists a function $F(x, y)$ such that
$$\frac{\partial F}{\partial x} = M(x, y) \quad \text{and} \quad \frac{\partial F}{\partial y} = N(x, y)$$

**Exactness Test**: The equation is exact if and only if
$$\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x}$$

**Solution Method**: If the equation is exact, the solution is $F(x, y) = C$ (an implicit curve), where:
1. Integrate $M$ with respect to $x$: $F(x, y) = \int M(x, y) \, dx + g(y)$
2. Differentiate with respect to $y$ and compare with $N$ to find $g(y)$.

## What Happens (Worked Example)
Label: "**What happens:**"

Consider $(2xy + 1) \, dx + (x^2 + 4) \, dy = 0$.

**Step 1:** Identify $M(x, y) = 2xy + 1$ and $N(x, y) = x^2 + 4$.

**Step 2:** Check exactness:
$$\frac{\partial M}{\partial y} = \frac{\partial}{\partial y}(2xy + 1) = 2x$$
$$\frac{\partial N}{\partial x} = \frac{\partial}{\partial x}(x^2 + 4) = 2x$$

Since $\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x}$, the equation is exact.

**Step 3:** Find $F(x, y)$ by integrating $M$ with respect to $x$:
$$F(x, y) = \int (2xy + 1) \, dx = x^2 y + x + g(y)$$
where $g(y)$ is an arbitrary function of $y$ only.

**Step 4:** Differentiate with respect to $y$ and set equal to $N$:
$$\frac{\partial F}{\partial y} = x^2 + g'(y) = N(x, y) = x^2 + 4$$

Comparing: $g'(y) = 4$, so $g(y) = 4y + C_0$.

**Step 5:** Write the solution:
$$F(x, y) = x^2 y + x + 4y = C$$

This is an implicit curve in the $xy$-plane. For any constant $C$, this equation defines the solution curve.

Label: "**Why it works:**"
An exact equation arises when $M \, dx + N \, dy$ is the **total differential** (or exact differential) of some function $F$. The condition $\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x}$ ensures that the "cross-derivatives" of $F$ are equal (by Schwarz's theorem for continuous second partials), making the equation integrable without requiring separation or special techniques.

## GATE MA Relevance
> **Why it matters in GATE MA:** Exact equations account for ~5-7% of GATE MA questions (2-4 marks). A typical question presents a differential equation and asks you to verify exactness, then find the solution. The core skills are: recognizing the form, applying the exactness test (partial derivatives), and performing the integration to construct $F(x, y)$. Many non-exact equations can be made exact by multiplying by an integrating factor—a harder variant that appears occasionally.
