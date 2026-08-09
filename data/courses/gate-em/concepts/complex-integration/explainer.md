# Complex Integration
> GATE Engineering Mathematics | Complex Variables | high frequency | difficulty: 0.6

## Intuition First
Complex integration is like summing infinitesimal contributions along a path in the complex plane. Imagine walking along a curve and collecting "work" done by a vector field at each step. The remarkable discovery is that for smooth functions (analytic functions), the work depends only on the start and end points, not the path taken — this is the basis of Cauchy's theorem, one of the most powerful theorems in mathematics.

## Core Definition
**Cauchy's Integral Theorem & Formula**: For an analytic function $f$ on and inside a closed contour $C$ (traced counterclockwise), Cauchy's integral theorem states:
$$\oint_C f(z) \, dz = 0$$

More generally, if $f$ is analytic inside a region and $C$ is a closed contour in that region, and if $z_0$ is inside $C$, then **Cauchy's Integral Formula** gives:
$$f(z_0) = \frac{1}{2\pi i} \oint_C \frac{f(z)}{z - z_0} \, dz$$

This formula allows us to extract the value of an analytic function at an interior point from its values on the boundary.

## What Happens (Worked Example)
Label: "**What happens:**"

Consider $\oint_C \frac{1}{z - 1} \, dz$ where $C$ is the circle $|z| = 2$ (radius 2, centered at origin), traced counterclockwise.

Using Cauchy's Integral Formula with $f(z) = 1$ (which is analytic everywhere), $z_0 = 1$ (inside $C$), and the contour $C$:
$$\oint_C \frac{1}{z - 1} \, dz = \oint_C \frac{f(z)}{z - z_0} \, dz = 2\pi i \cdot f(z_0) = 2\pi i \cdot 1 = 2\pi i$$

Now consider $\oint_C \frac{1}{(z-1)(z-3)} \, dz$ on the same circle $|z| = 2$.

Only the pole $z = 1$ lies inside $C$ (since $|1| = 1 < 2$ but $|3| = 3 > 2$). Use partial fractions:
$$\frac{1}{(z-1)(z-3)} = \frac{-1/2}{z-1} + \frac{1/2}{z-3}$$

By Cauchy's theorem, the integral around the second term is zero (the pole at $z = 3$ is outside). For the first term:
$$\oint_C \frac{-1/2}{z-1} \, dz = -\frac{1}{2} \oint_C \frac{1}{z - 1} \, dz = -\frac{1}{2} \cdot 2\pi i = -\pi i$$

Geometrically, the value $2\pi i$ encodes a complete 360° winding around the pole $z=1$; the factor of $2\pi$ comes from measuring radians.

Label: "**Why it works:**"
Cauchy's theorem holds because for analytic functions, the integrand is "smooth" — no singularities or breaks — so paths can be continuously deformed without changing the integral. When the path shrinks to a point, the integral vanishes. Cauchy's Integral Formula is then a consequence: the integrand $\frac{f(z)}{z - z_0}$ has a pole at $z_0$, but the integral formula "picks out" exactly $f(z_0)$ scaled by the winding number of the contour around the pole.

## GATE MA Relevance
> **Why it matters in GATE MA:** Complex integration appears in 1–3 GATE MA questions, typically asking for line integrals around closed contours, application of Cauchy's theorem, or Cauchy's integral formula. Problems often combine identifying the poles, determining which lie inside the contour, and computing the residue (or using the integral formula directly). Mastery of this is prerequisite for residue calculus.
