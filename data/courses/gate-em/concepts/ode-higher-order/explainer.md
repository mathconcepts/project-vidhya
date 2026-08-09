# Higher Order ODEs
> GATE Engineering Mathematics | Differential Equations | medium frequency | difficulty: 0.7

## Intuition First
Higher-order ODEs describe systems with more "degrees of freedom" or memory. A third-order ODE might model a crane with inertia, damping, and elasticity all layered together. The solution generalizes naturally from second-order: more roots, more independent modes, richer behavior.

## Core Definition
**General $n$-th Order Linear ODE** (constant coefficients, homogeneous):
$$a_n \frac{d^ny}{dx^n} + a_{n-1} \frac{d^{n-1}y}{dx^{n-1}} + \cdots + a_1 \frac{dy}{dx} + a_0 y = 0$$

**Characteristic Equation**:
$$a_n r^n + a_{n-1} r^{n-1} + \cdots + a_1 r + a_0 = 0$$

**General Solution** (combining all roots):
- **Real root $r$** (multiplicity $m$): contributes $(C_1 + C_2 x + \cdots + C_m x^{m-1}) e^{rx}$
- **Complex conjugate pair $\alpha \pm i\beta$** (multiplicity $m$): contributes $e^{\alpha x}[(A_1 + A_2 x + \cdots + A_m x^{m-1})\cos(\beta x) + (B_1 + B_2 x + \cdots + B_m x^{m-1})\sin(\beta x)]$

## What Happens (Worked Example)
Label: "**What happens:**"

Consider $\frac{d^3y}{dx^3} - 3\frac{d^2y}{dx^2} + 2\frac{dy}{dx} = 0$.

**Step 1:** Form the characteristic equation:
$$r^3 - 3r^2 + 2r = 0$$

**Step 2:** Factor:
$$r(r^2 - 3r + 2) = 0$$
$$r(r - 1)(r - 2) = 0$$
$$r_1 = 0, \quad r_2 = 1, \quad r_3 = 2$$

Three distinct real roots.

**Step 3:** Write the general solution. Each root contributes an exponential term:
- $r_1 = 0$ gives $e^{0 \cdot x} = 1$ (constant function)
- $r_2 = 1$ gives $e^x$
- $r_3 = 2$ gives $e^{2x}$

**General Solution:**
$$y(x) = C_1 e^{0 \cdot x} + C_2 e^x + C_3 e^{2x} = C_1 + C_2 e^x + C_3 e^{2x}$$

Geometrically, this is a superposition of three independent exponential modes: a constant baseline, a slowly growing exponential, and a rapidly growing exponential. The initial conditions (three of them: $y(0), y'(0), y''(0)$) pin down $C_1, C_2, C_3$.

**Step 4 (application example):** If the initial conditions are $y(0) = 1, y'(0) = 0, y''(0) = 0$:

Write $y = C_1 + C_2 e^x + C_3 e^{2x}$.

$y' = C_2 e^x + 2C_3 e^{2x}$

$y'' = C_2 e^x + 4C_3 e^{2x}$

Substitute:
- $y(0) = C_1 + C_2 + C_3 = 1$
- $y'(0) = C_2 + 2C_3 = 0$
- $y''(0) = C_2 + 4C_3 = 0$

From the second equation: $C_2 = -2C_3$.
From the third equation: $-2C_3 + 4C_3 = 0 \Rightarrow C_3 = 0 \Rightarrow C_2 = 0$.
From the first equation: $C_1 = 1$.

**Particular Solution:** $y(x) = 1$ (the trivial solution satisfying all initial conditions).

Label: "**Why it works:**"
Higher-order ODEs have a characteristic polynomial of degree $n$, yielding $n$ roots (counting multiplicity, in $\mathbb{C}$). Each root (or pair of complex conjugates) contributes one basis function to the solution space. Linear independence of these basis functions is guaranteed by the theory, and any particular solution is uniquely determined by $n$ initial conditions ($y(0), y'(0), \ldots, y^{(n-1)}(0)$).

## GATE MA Relevance
> **Why it matters in GATE MA:** Higher-order ODEs (3rd order and above) account for ~8-10% of GATE MA questions (4-8 marks). Questions are typically 2-mark NATs asking you to: (1) find the characteristic roots and write the general solution form, or (2) solve a specific initial-value problem. The core challenge is factoring the characteristic polynomial (often a cubic)—GATE usually designs problems where roots are "nice" (integers, simple rationals). Recognizing when a zero root appears (indicating a constant term in the solution) is a common trick.
