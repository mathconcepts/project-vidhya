# Residue Calculus
> GATE Engineering Mathematics | Complex Variables | high frequency | difficulty: 0.7

## Intuition First
Residue calculus is the master key to complex integration. The insight: when you want to integrate a function with poles, instead of integrating along the contour directly, you "peek inside" at the poles, extract their residues (a single number per pole), multiply by $2\pi i$, and add them up. This transforms hard contour integrals into simple arithmetic. It's like replacing a complicated path integral with a data lookup at special points.

## Core Definition
**The Residue Theorem**: Let $f$ be analytic on and inside a closed contour $C$ except for isolated singularities $z_1, z_2, \ldots, z_n$ inside $C$. Then:
$$\oint_C f(z) \, dz = 2\pi i \sum_{k=1}^{n} \text{Res}(f, z_k)$$

The **residue** at a pole $z_k$ of order $m$ is given by:
$$\text{Res}(f, z_k) = \frac{1}{(m-1)!} \lim_{z \to z_k} \frac{d^{m-1}}{dz^{m-1}} \left[ (z - z_k)^m f(z) \right]$$

For a **simple pole** (order 1):
$$\text{Res}(f, z_k) = \lim_{z \to z_k} (z - z_k) f(z)$$

## What Happens (Worked Example)
Label: "**What happens:**"

Evaluate $\oint_C \frac{3z + 1}{(z-1)(z+2)} \, dz$ where $C$ is the circle $|z| = 2.5$.

**Step 1**: Identify poles. The poles are at $z = 1$ and $z = -2$. Both lie inside $C$ (since $|1| = 1 < 2.5$ and $|-2| = 2 < 2.5$).

**Step 2**: Compute residues using partial fractions.
$$\frac{3z+1}{(z-1)(z+2)} = \frac{A}{z-1} + \frac{B}{z+2}$$

Multiply by $(z-1)(z+2)$: $3z + 1 = A(z+2) + B(z-1)$.
- Set $z = 1$: $4 = 3A \Rightarrow A = 4/3$. So $\text{Res}(f, 1) = 4/3$.
- Set $z = -2$: $-5 = -3B \Rightarrow B = 5/3$. So $\text{Res}(f, -2) = 5/3$.

**Step 3**: Apply the Residue Theorem.
$$\oint_C \frac{3z+1}{(z-1)(z+2)} \, dz = 2\pi i \left( \frac{4}{3} + \frac{5}{3} \right) = 2\pi i \cdot 3 = 6\pi i$$

Geometrically: walking around the contour counterclockwise, we encounter two poles. Each pole "spirals" the integrand in a specific way; the total spiral is $6\pi i$.

Label: "**Why it works:**"
The residue theorem is a consequence of Cauchy's integral formula and Laurent series. When $f$ has a pole at $z_k$, its Laurent expansion near $z_k$ includes a term $\frac{c_{-1}}{z - z_k}$ (the residue). When you integrate this term around a contour enclosing $z_k$, you get $2\pi i \cdot c_{-1}$ by Cauchy's formula. The other powers integrate to zero. Thus the integral reduces to summing residues.

## GATE MA Relevance
> **Why it matters in GATE MA:** Residue calculus is one of the most heavily tested topics in GATE MA (typically 3–4 questions). Problems ask to: (1) compute residues at given poles, (2) apply the residue theorem to evaluate contour integrals, (3) handle higher-order poles and removable singularities, or (4) use residue calculus to evaluate real integrals (e.g., integrals over $(-\infty, +\infty)$). Mastery of residues is essential for any competitive exam in mathematics or engineering.
