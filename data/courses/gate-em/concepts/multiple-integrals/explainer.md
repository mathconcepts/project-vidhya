# Multiple Integrals

> GATE Engineering Mathematics | Calculus | high frequency | difficulty: 0.7

## Intuition First

A double integral computes volume under a surface, like a single integral computes area under a curve. A triple integral computes volume of a solid region in 3D space.

## Core Definition

**Double Integral** (over region $R$ in the $xy$-plane):
$$\iint_R f(x, y) \, dA = \int_a^b \int_{c(x)}^{d(x)} f(x, y) \, dy \, dx$$

**Iterated Integration**: Compute the inner integral first (with respect to $y$), then the outer integral (with respect to $x$).

**Fubini's Theorem**: For rectangular regions (or well-behaved regions), the order of integration can be swapped:
$$\int_a^b \int_c^d f(x, y) \, dy \, dx = \int_c^d \int_a^b f(x, y) \, dx \, dy$$

## What Happens (Worked Example)

**Example**: Compute $\iint_R xy \, dA$ over $R = \{(x, y) : 0 \leq x \leq 2, 0 \leq y \leq 1\}$.

$$\iint_R xy \, dA = \int_0^2 \int_0^1 xy \, dy \, dx$$

Inner integral (w.r.t. $y$, treat $x$ as constant):
$$\int_0^1 xy \, dy = x \cdot \frac{y^2}{2}\Big|_0^1 = x \cdot \frac{1}{2}$$

Outer integral:
$$\int_0^2 \frac{x}{2} dx = \frac{1}{2} \cdot \frac{x^2}{2}\Big|_0^2 = \frac{1}{2} \cdot 2 = 1$$

**Volume under $z = xy$ over the rectangle $[0, 2] \times [0, 1]$ is $1$ cubic unit.**

## GATE MA Relevance

> **Why it matters in GATE MA:** Multiple integrals compute volumes, areas, and moments. GATE asks: set up and evaluate double integrals (MCQ or NAT). Often 2 marks. Change of variables (polar coordinates) is also tested.
