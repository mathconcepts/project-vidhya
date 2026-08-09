# Taylor & Laurent Series
> GATE Engineering Mathematics | Complex Variables | high frequency | difficulty: 0.6

## Intuition First
A Taylor series is a way to approximate a smooth function using an infinite sum of power terms $(z - z_0)^n$. Imagine zooming in on a curve near a point — the closer you zoom, the more it looks like a polynomial. A Laurent series extends this idea: even around a point where the function has a pole (singularity), you can expand it as a series, but now the series includes **negative powers** like $(z - z_0)^{-n}$ as well. The negative-power part encodes the "badness" near the singularity.

## Core Definition
**Taylor Series**: If $f$ is analytic in a disk $|z - z_0| < R$, then:
$$f(z) = \sum_{n=0}^{\infty} a_n (z - z_0)^n, \quad \text{where} \quad a_n = \frac{f^{(n)}(z_0)}{n!}$$

**Laurent Series**: If $f$ is analytic in an annulus $r < |z - z_0| < R$ (around a singularity at $z_0$), then:
$$f(z) = \sum_{n=-\infty}^{\infty} c_n (z - z_0)^n$$

where the **principal part** (negative powers) reveals the singularity structure. The coefficient $c_{-1}$ of $(z - z_0)^{-1}$ is called the **residue** of $f$ at $z_0$.

## What Happens (Worked Example)
Label: "**What happens:**"

**Taylor series example**: Expand $f(z) = e^z$ around $z_0 = 0$.

Since $f^{(n)}(z) = e^z$ for all $n$, we have $f^{(n)}(0) = 1$. Thus:
$$e^z = \sum_{n=0}^{\infty} \frac{z^n}{n!} = 1 + z + \frac{z^2}{2!} + \frac{z^3}{3!} + \cdots$$

This series converges for all $z \in \mathbb{C}$ (radius of convergence $R = \infty$).

**Laurent series example**: Expand $f(z) = \frac{1}{z(z-1)}$ around $z_0 = 0$ in the annulus $0 < |z| < 1$.

Use partial fractions: $\frac{1}{z(z-1)} = -\frac{1}{z} + \frac{1}{z-1}$.

For $|z| < 1$:
$$\frac{1}{z-1} = -\frac{1}{1-z} = -\sum_{n=0}^{\infty} z^n = -1 - z - z^2 - \cdots$$

Therefore:
$$f(z) = -\frac{1}{z} - 1 - z - z^2 - \cdots = \sum_{n=1}^{\infty} (-1)^{n+1} z^{-n} + \sum_{n=0}^{\infty} (-1)^{n+1} z^n$$

The principal part is $-\frac{1}{z}$. The residue (coefficient of $z^{-1}$) is $c_{-1} = -1$. Geometrically, this Laurent series shows that $f$ has a simple pole at $z = 0$ with residue $-1$; the pole "pulls" the function to infinity as we approach $z=0$ from any direction.

Label: "**Why it works:**"
Taylor's expansion is justified by Cauchy's integral formula: the coefficients $a_n = \frac{f^{(n)}(z_0)}{n!}$ encode all derivatives at $z_0$, which determine the function's shape locally. Laurent's generalization allows negative powers: the principal part captures the singular behavior. The residue $c_{-1}$ turns out to be crucial for complex integration — it's the "residue" that determines the value of a contour integral by the residue theorem.

## GATE MA Relevance
> **Why it matters in GATE MA:** Taylor and Laurent series appear in 1–2 GATE MA questions, usually asking to: (1) find the Taylor series expansion of a given function around a point, (2) identify the region of convergence, (3) find the Laurent series in an annulus, or (4) extract the residue from a Laurent expansion. Mastery of series expansion is the gateway to understanding residue calculus, which solves many integrals elegantly.
