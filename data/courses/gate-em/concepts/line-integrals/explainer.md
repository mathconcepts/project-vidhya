# Line Integrals

> GATE Engineering Mathematics | Vector Calculus | high frequency | difficulty: 0.5

## Intuition First

A line integral adds up the "effect" of a vector field along a curve—imagine pushing an object along a winding path against friction, and computing the total work done. The path matters, and you're summing contributions at each infinitesimal step.

## Core Definition

**Line Integral of a Vector Field**: Along a curve $C$ parameterized by $\mathbf{r}(t) = x(t)\mathbf{i} + y(t)\mathbf{j} + z(t)\mathbf{k}$ for $t \in [a, b]$, the line integral of $\mathbf{F}$ is:
$$\int_C \mathbf{F} \cdot d\mathbf{r} = \int_a^b \mathbf{F}(\mathbf{r}(t)) \cdot \frac{d\mathbf{r}}{dt} dt = \int_a^b [P(x(t), y(t), z(t))x'(t) + Q(x(t), y(t), z(t))y'(t) + R(x(t), y(t), z(t))z'(t)] dt$$

**Path Independence**: If $\mathbf{F}$ is conservative (i.e., $\mathbf{F} = \nabla f$), then:
$$\int_C \mathbf{F} \cdot d\mathbf{r} = f(\text{endpoint}) - f(\text{startpoint})$$

regardless of the path $C$ connecting them. This is the **Fundamental Theorem of Line Integrals**.

## What Happens (Worked Example)

**What happens:**

Consider $\mathbf{F}(x, y) = 2x\mathbf{i} + 3y\mathbf{j}$ and the line segment $C$ from $(0, 0)$ to $(1, 1)$.

**Method 1: Direct parameterization**
Parameterize $C$ as $\mathbf{r}(t) = t\mathbf{i} + t\mathbf{j}$ for $t \in [0, 1]$.
$$\frac{d\mathbf{r}}{dt} = \mathbf{i} + \mathbf{j}$$

Substitute into the field:
$$\mathbf{F}(\mathbf{r}(t)) = 2t\mathbf{i} + 3t\mathbf{j}$$

Compute the dot product:
$$\mathbf{F} \cdot \frac{d\mathbf{r}}{dt} = (2t, 3t) \cdot (1, 1) = 2t + 3t = 5t$$

Integrate:
$$\int_C \mathbf{F} \cdot d\mathbf{r} = \int_0^1 5t \, dt = \left[\frac{5t^2}{2}\right]_0^1 = \frac{5}{2}$$

**Method 2: Using the potential function**
Check if $\mathbf{F}$ is conservative: $\frac{\partial(2x)}{\partial y} = 0$ and $\frac{\partial(3y)}{\partial x} = 0$ ✓

Find $f$: $\frac{\partial f}{\partial x} = 2x \Rightarrow f = x^2 + g(y)$, and $\frac{\partial f}{\partial y} = 3y \Rightarrow g(y) = \frac{3y^2}{2}$

So $f(x, y) = x^2 + \frac{3y^2}{2}$.

Line integral: $\int_C \mathbf{F} \cdot d\mathbf{r} = f(1, 1) - f(0, 0) = (1 + \frac{3}{2}) - 0 = \frac{5}{2}$ ✓

**Why it works:**

Method 1 respects the geometry of the curve by parameterizing it and summing the field's component along the direction of motion. Method 2 exploits the conservative property—the field has stored energy (potential), and the integral is simply the change in that energy. Both give the same answer because the field is conservative.

## GATE MA Relevance

> **Why it matters in GATE MA:** Line integrals appear in ~60% of GATE vector calculus questions (1–3 marks). Key topics: computing line integrals via parameterization, recognizing when to use the Fundamental Theorem (conservative fields), and setting up integrals for Stokes' and Green's theorems. High-frequency computation skills.

