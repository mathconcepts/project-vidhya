# Analytic Functions
> GATE Engineering Mathematics | Complex Variables | high frequency | difficulty: 0.5

## Intuition First
An analytic function is a "smooth" complex function — one that can be zoomed in arbitrarily without the graph developing jagged edges or discontinuities. In the real world, it's like water flow that never has turbulence or sudden breaks. Geometrically, analytic functions preserve angles locally (conformal), which makes them invaluable for solving physics problems.

## Core Definition
**Cauchy-Riemann Equations**: A complex function $f(z) = u(x, y) + iv(x, y)$ (where $u, v$ are real-valued functions of real variables $x, y$) is **analytic** in a region $D$ if it is differentiable at every point in $D$. This is equivalent to the **Cauchy-Riemann equations** holding:

$$\frac{\partial u}{\partial x} = \frac{\partial v}{\partial y} \quad \text{and} \quad \frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x}$$

When these hold and all partial derivatives are continuous, the complex derivative exists and equals:
$$f'(z) = \frac{\partial u}{\partial x} + i\frac{\partial v}{\partial x}$$

## What Happens (Worked Example)
Label: "**What happens:**"

Consider $f(z) = z^2$. Write $z = x + iy$, so $f(z) = (x + iy)^2 = x^2 - y^2 + 2ixy$.
Thus $u(x, y) = x^2 - y^2$ and $v(x, y) = 2xy$.

Check the Cauchy-Riemann equations:
- $\frac{\partial u}{\partial x} = 2x$ and $\frac{\partial v}{\partial y} = 2x$ ✓ Equal.
- $\frac{\partial u}{\partial y} = -2y$ and $-\frac{\partial v}{\partial x} = -(2y) = -2y$ ✓ Equal.

All partial derivatives are continuous everywhere, so $f(z) = z^2$ is analytic on all of $\mathbb{C}$. The derivative is:
$$f'(z) = \frac{\partial u}{\partial x} + i\frac{\partial v}{\partial x} = 2x + i(2y) = 2(x + iy) = 2z$$

Geometrically at each point $z$, multiplication by $f'(z) = 2z$ rotates and scales infinitesimal displacements: angles are preserved (conformal), and scales are determined by $|f'(z)| = 2|z|$.

Label: "**Why it works:**"
The Cauchy-Riemann conditions are the unique compatibility constraint that allows a function to be "holomorphic" (complex-differentiable) in the sense that the derivative $f'(z) = \lim_{\Delta z \to 0} \frac{f(z + \Delta z) - f(z)}{\Delta z}$ exists **regardless of the direction of $\Delta z$**. In the real plane, a limit can approach from infinitely many directions; the Cauchy-Riemann equations ensure they all give the same answer.

## GATE MA Relevance
> **Why it matters in GATE MA:** GATE tests analytic functions in 2–3 questions (usually MCQs). Typical problems ask: (1) determine if a given function satisfies Cauchy-Riemann, (2) find the derivative using Cauchy-Riemann, (3) identify which functions are NOT analytic (e.g., $f(z) = \bar{z}$ or $f(z) = |z|$ fail Cauchy-Riemann everywhere). A solid understanding of C-R equations is prerequisite for integration theorems that follow.
