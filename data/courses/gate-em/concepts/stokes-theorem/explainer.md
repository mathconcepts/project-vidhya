# Stokes' Theorem

> GATE Engineering Mathematics | Vector Calculus | high frequency | difficulty: 0.7

## Intuition First

Stokes' Theorem is the 3D generalization of Green's Theorem: it relates the "circulation" of a vector field around a closed curve to the "swirl" (curl) passing through the surface bounded by that curve. Imagine a spinning waterwheel in a river—the total spin of the wheel equals the integral of the water's local swirl across its blades.

## Core Definition

**Stokes' Theorem**: For a surface $S$ with boundary curve $C$ (both oriented consistently via the right-hand rule), and a vector field $\mathbf{F}$ differentiable on $S$:
$$\oint_C \mathbf{F} \cdot d\mathbf{r} = \iint_S (\nabla \times \mathbf{F}) \cdot \mathbf{n} \, dS$$

The left side is the line integral around the boundary; the right side is the flux of curl through the surface. Orientation: if your right thumb points along $\mathbf{n}$ (normal to $S$), your fingers curl in the direction of $C$.

**Component Form**: If $\mathbf{F} = P\mathbf{i} + Q\mathbf{j} + R\mathbf{k}$ and $\mathbf{n} = (n_x, n_y, n_z)$:
$$\oint_C P \, dx + Q \, dy + R \, dz = \iint_S \begin{vmatrix} n_x & n_y & n_z \\ \frac{\partial}{\partial x} & \frac{\partial}{\partial y} & \frac{\partial}{\partial z} \\ P & Q & R \end{vmatrix} dS$$

## What Happens (Worked Example)

**What happens:**

Consider $\mathbf{F}(x, y, z) = z\mathbf{i} + x\mathbf{j} + y\mathbf{k}$, and the surface $S$: the upper hemisphere $z = \sqrt{1 - x^2 - y^2}$ with boundary $C$: the circle $x^2 + y^2 = 1$ at $z = 0$ (counterclockwise when viewed from above).

**Method 1: Line integral around the boundary**
Parameterize $C$: $\mathbf{r}(t) = \cos t \, \mathbf{i} + \sin t \, \mathbf{j} + 0\mathbf{k}$ for $t \in [0, 2\pi]$.

$$\frac{d\mathbf{r}}{dt} = -\sin t \, \mathbf{i} + \cos t \, \mathbf{j}$$

On the circle, $\mathbf{F}(\mathbf{r}(t)) = 0\mathbf{i} + \cos t \, \mathbf{j} + \sin t \, \mathbf{k}$.

$$\mathbf{F} \cdot \frac{d\mathbf{r}}{dt} = (\cos t)(\cos t) = \cos^2 t$$

$$\oint_C \mathbf{F} \cdot d\mathbf{r} = \int_0^{2\pi} \cos^2 t \, dt = \pi$$

**Method 2: Curl through the surface**
Compute curl:
$$\nabla \times \mathbf{F} = \begin{vmatrix} \mathbf{i} & \mathbf{j} & \mathbf{k} \\ \frac{\partial}{\partial x} & \frac{\partial}{\partial y} & \frac{\partial}{\partial z} \\ z & x & y \end{vmatrix} = (1)\mathbf{i} + (1)\mathbf{j} + (1)\mathbf{k} = \mathbf{i} + \mathbf{j} + \mathbf{k}$$

On the hemisphere, the upward-pointing unit normal is $\mathbf{n} = (x, y, z)$ (radial).

$$(\nabla \times \mathbf{F}) \cdot \mathbf{n} = (1, 1, 1) \cdot (x, y, z) = x + y + z$$

On the hemisphere where $z = \sqrt{1 - x^2 - y^2}$:
$$\iint_S (x + y + z) \, dS = \iint_S (x + y) \, dS + \iint_S z \, dS$$

By symmetry (odd functions integrated over symmetric regions), $\iint_S (x + y) \, dS = 0$. The remaining integral $\iint_S z \, dS = \pi$ (computed via spherical coordinates or parametrization).

Result: $\iint_S (\nabla \times \mathbf{F}) \cdot \mathbf{n} \, dS = \pi$ ✓

**Why it works:**

The circulation around the boundary equals the total curl "passing through" the surface. By Stokes' Theorem, we don't need to walk the boundary; we compute the curl and integrate it over any surface with that boundary. This converts a potentially complex line integral into a surface integral—often simpler.

## GATE MA Relevance

> **Why it matters in GATE MA:** Stokes' Theorem is tested in ~1–2 GATE questions (2–3 marks each). Typical pattern: "Evaluate $\oint_C \mathbf{F} \cdot d\mathbf{r}$" where the curve is complex (e.g., intersection of a sphere and cone). Novices parameterize the curve; experts use Stokes' Theorem to convert to a surface integral. Key skill: recognizing when a surface integral is easier than the line integral.

