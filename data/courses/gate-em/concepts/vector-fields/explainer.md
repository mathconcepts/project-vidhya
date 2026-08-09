# Vector Fields

> GATE Engineering Mathematics | Vector Calculus | high frequency | difficulty: 0.4

## Intuition First

Imagine assigning an arrow (magnitude and direction) to every point in space — like a wind map where each location has its own wind velocity. That's a vector field: a function that outputs a vector at every point. Scalar fields are simpler (temperature at every point), but vector fields model flows: fluids, electric fields, gravity.

## Core Definition

**Vector Field (3D)**: A vector field $\mathbf{F}$ is a function that assigns a vector to each point $(x, y, z)$ in space:
$$\mathbf{F}(x, y, z) = P(x, y, z)\mathbf{i} + Q(x, y, z)\mathbf{j} + R(x, y, z)\mathbf{k}$$

where $P$, $Q$, $R$ are scalar functions (the component functions). 

**Gradient Field (Conservative)**: A vector field $\mathbf{F}$ is conservative if it equals the gradient of a scalar potential function $f$:
$$\mathbf{F} = \nabla f = \frac{\partial f}{\partial x}\mathbf{i} + \frac{\partial f}{\partial y}\mathbf{j} + \frac{\partial f}{\partial z}\mathbf{k}$$

For a conservative field, the line integral depends only on endpoints, not the path taken.

## What Happens (Worked Example)

**What happens:**

Consider the vector field $\mathbf{F}(x, y) = x\mathbf{i} + y\mathbf{j}$ (a radial field pointing outward from origin).

- At point $(1, 0)$: $\mathbf{F}(1, 0) = 1\mathbf{i} + 0\mathbf{j} = (1, 0)$ — arrow of length 1 pointing right.
- At point $(1, 1)$: $\mathbf{F}(1, 1) = 1\mathbf{i} + 1\mathbf{j} = (1, 1)$ — arrow of length $\sqrt{2}$ pointing northeast at 45°.
- At point $(0, 2)$: $\mathbf{F}(0, 2) = 0\mathbf{i} + 2\mathbf{j} = (0, 2)$ — arrow of length 2 pointing straight up.

Check if conservative: Does there exist $f(x, y)$ such that $\frac{\partial f}{\partial x} = x$ and $\frac{\partial f}{\partial y} = y$?
- From $\frac{\partial f}{\partial x} = x$: integrate w.r.t. $x$ to get $f(x, y) = \frac{x^2}{2} + g(y)$.
- From $\frac{\partial f}{\partial y} = y$: we need $\frac{\partial}{\partial y}\left[\frac{x^2}{2} + g(y)\right] = g'(y) = y$, so $g(y) = \frac{y^2}{2}$.
- Thus $f(x, y) = \frac{x^2 + y^2}{2}$ and $\mathbf{F} = \nabla f$ — **this field is conservative.**

**Why it works:**

A radial field $\mathbf{F}(x, y) = x\mathbf{i} + y\mathbf{j}$ is conservative because every component is a partial derivative of a single scalar function. Geometrically, conservative fields have no "swirl" — they represent pure expansion or contraction from sources/sinks.

## GATE MA Relevance

> **Why it matters in GATE MA:** Vector fields appear frequently in fluid mechanics and electromagnetic theory (1–2 marks per exam). Questions test recognition of conservative fields, computation of potential functions, and line-integral independence. High-frequency foundation for divergence, curl, and Stokes' theorem questions.

