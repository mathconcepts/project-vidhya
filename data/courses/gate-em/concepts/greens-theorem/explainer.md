# Green's Theorem

> GATE Engineering Mathematics | Vector Calculus | high frequency | difficulty: 0.6

## Intuition First

Green's Theorem connects two different ways of measuring circulation around a closed loop: (1) walking around the boundary and measuring the field's "push" along the path, or (2) measuring the total "swirl" inside the region. They're equal—one of mathematics' most powerful dualities.

## Core Definition

**Green's Theorem (Circulation-Curl Form)**: For a positively oriented (counterclockwise) simple closed curve $C$ bounding a region $D$ in the plane:
$$\oint_C P \, dx + Q \, dy = \iint_D \left(\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}\right) dA$$

The right-hand side is the integral of the $z$-component of curl (the "swirl density").

**Green's Theorem (Divergence-Flux Form)**: For the same curve and region:
$$\oint_C P \, dy - Q \, dx = \iint_D \left(\frac{\partial P}{\partial x} + \frac{\partial Q}{\partial y}\right) dA$$

The right-hand side is the integral of divergence (the "expansion density"). Here, the line integral is taken with outward normal.

## What Happens (Worked Example)

**What happens:**

Consider $C$: the square with vertices $(0, 0)$, $(1, 0)$, $(1, 1)$, $(0, 1)$ (counterclockwise), and the field $\mathbf{F} = -y\mathbf{i} + x\mathbf{j}$.

**Direct computation (line integral):**
Walk counterclockwise around the square:
- Bottom edge: $(0, 0) \to (1, 0)$, $P dx + Q dy = (-y)(1) + (x)(0) = 0$ for $y = 0$, integral = 0.
- Right edge: $(1, 0) \to (1, 1)$, $P dx + Q dy = (-y)(0) + (x)(1) = x = 1$, integral = $\int_0^1 1 \, dy = 1$.
- Top edge: $(1, 1) \to (0, 1)$, $P dx + Q dy = (-1)(-1) + (x)(0) = 1$, integral = $\int_1^0 1 \, dx = -1$. Wait, let me recompute.

Actually, for the top edge $(1, 1) \to (0, 1)$: $y = 1$ (constant), $dy = 0$, $x$ goes from 1 to 0, so $dx = -dt$ for $t \in [0, 1]$. The integrand is $P dx + Q dy = (-1)dx + x(0) = -dx$. Integral: $\int_{x=1}^{x=0} (-1) dx = \int_1^0 (-1) dx = 1$.

- Left edge: $(0, 1) \to (0, 0)$, $P dx + Q dy = (-y)(0) + (0)(dy) = 0$, integral = 0.

Total line integral: $0 + 1 + 1 + 0 = 2$.

**Using Green's Theorem:**
$P = -y$, $Q = x$.
$$\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y} = 1 - (-1) = 2$$

$$\iint_D 2 \, dA = 2 \cdot \text{(area of square)} = 2 \cdot 1 = 2$$ ✓

**Why it works:**

The field $\mathbf{F} = -y\mathbf{i} + x\mathbf{j}$ is a rigid counterclockwise rotation (curl density = 2 everywhere). Green's Theorem says the total circulation equals the integral of curl—which is exactly what we expect: stronger swirl inside → stronger circulation around the boundary.

## GATE MA Relevance

> **Why it matters in GATE MA:** Green's Theorem is the foundation for Stokes' and Gauss' theorems (3D analogues). GATE tests it directly (~1–2 marks) and indirectly (~2–3 marks via 3D theorems). Key skills: (1) identifying when to use Green's Theorem to replace a line integral with a double integral, (2) computing curl integrals quickly, (3) recognizing conservative fields ($\nabla \times \mathbf{F} = 0$ ⟹ line integral = 0).

