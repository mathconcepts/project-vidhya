# Conformal Mapping
> GATE Engineering Mathematics | Complex Variables | low frequency | difficulty: 0.7

## Intuition First
A conformal map is a function that preserves angles locally. Imagine taking a rubber sheet with grid lines and stretching/twisting it: at every point, if the angles between two curves remain the same (only the magnitudes of lengths change), the map is conformal. In physics, conformal maps solve Laplace's equation by transforming one domain into another while preserving the governing equations. They're the bridge between complex analysis and real-world problems.

## Core Definition
**Conformal Mapping**: An analytic function $f(z) = u(x, y) + iv(x, y)$ is called **conformal** at a point $z_0$ if $f'(z_0) \neq 0$ and if $f$ preserves angles at $z_0$. Geometrically, this means:
- Two curves intersecting at $z_0$ have the same angle of intersection before and after applying $f$.
- The magnification factor is $|f'(z_0)|$ (all lengths scale uniformly near $z_0$).

**Key Fact**: Every analytic function with $f'(z) \neq 0$ is conformal. The Jacobian determinant of $f$ is $|f'(z)|^2 > 0$, ensuring local invertibility.

## What Happens (Worked Example)
Label: "**What happens:**"

Consider $f(z) = z^2$, which maps the complex plane to itself.

1. **Region**: Map the first quadrant (Re$(z) > 0$, Im$(z) > 0$) under $f(z) = z^2$.
   If $z = re^{i\theta}$ with $0 < \theta < \pi/2$ and $r > 0$, then $f(z) = r^2 e^{2i\theta}$ with $0 < 2\theta < \pi$.
   The first quadrant maps to the upper half-plane. ✓ The angle at $z = 0$ is NOT preserved here ($f'(0) = 0$), so the map is not conformal at the origin.

2. **Angles**: At $z = 1 + i = \sqrt{2} e^{i\pi/4}$, we have $f(1+i) = (1+i)^2 = 2i = 2e^{i\pi/2}$.
   The angle $\theta = 45°$ is doubled to $2\theta = 90°$. But the angle **between two curves** at their intersection is preserved.
   Example: the line Re$(z) = 1$ and Im$(z) = 1$ meet at angle $90°$ at $z = 1+i$. Their images under $f$ are curves in the complex plane that also intersect at $90°$ at $f(1+i) = 2i$. ✓

3. **Magnification**: $f'(z) = 2z$, so $f'(1+i) = 2(1+i)$. The magnification factor is $|f'(1+i)| = 2|1+i| = 2\sqrt{2}$. Lengths scale by $2\sqrt{2}$.

Geometrically: the map $z^2$ is conformal everywhere except at $z = 0$ (where the derivative vanishes). It rotates and scales locally, preserving angles.

Label: "**Why it works:**"
An analytic function $f$ has a linear approximation $f(z + \Delta z) \approx f(z) + f'(z) \Delta z$ near any point. Multiplication by $f'(z)$ is a rotation and scaling. Rotation preserves angles; scaling changes magnitudes uniformly. The Cauchy-Riemann equations ensure that the partial derivatives are aligned in a way that guarantees this geometric property.

## GATE MA Relevance
> **Why it matters in GATE MA:** Conformal mapping is less frequently tested in GATE MA (typically 0–1 question) but appears in advanced problem sets. When tested, questions ask to: (1) identify or verify that a given function is conformal (check $f'(z) \neq 0$ and Cauchy-Riemann), (2) map a region under a known conformal map (e.g., $z^2$, $e^z$, $\sin z$), or (3) use conformal maps to solve a boundary value problem (e.g., Laplace's equation with Dirichlet boundary conditions). Understanding conformal maps deepens insight into analytic functions and their geometric interpretation.
