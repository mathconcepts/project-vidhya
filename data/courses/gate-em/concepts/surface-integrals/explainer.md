# Surface Integrals

> GATE Engineering Mathematics | Vector Calculus | medium frequency | difficulty: 0.6

## Intuition First

A surface integral sums up the flow of a field through a curved surface—imagine measuring how much water flows through a net held at an angle in a river. The flow depends on the field's strength *and* the surface's orientation (the normal vector).

## Core Definition

**Surface Integral of a Vector Field (Flux)**: For a surface $S$ parameterized by $\mathbf{r}(u, v)$, the flux of $\mathbf{F}$ through $S$ is:
$$\iint_S \mathbf{F} \cdot \mathbf{n} \, dS = \iint_D \mathbf{F}(\mathbf{r}(u, v)) \cdot \left(\frac{\partial \mathbf{r}}{\partial u} \times \frac{\partial \mathbf{r}}{\partial v}\right) du \, dv$$

where $\mathbf{n} = \frac{\partial \mathbf{r}}{\partial u} \times \frac{\partial \mathbf{r}}{\partial v}$ is the normal vector to the surface (cross product of tangent vectors).

**Alternative Form (Projection)**: If $S$ is given by $z = g(x, y)$, then:
$$\iint_S \mathbf{F} \cdot \mathbf{n} \, dS = \iint_D \left(-P \frac{\partial g}{\partial x} - Q \frac{\partial g}{\partial y} + R\right) dx \, dy$$

where $\mathbf{F} = P\mathbf{i} + Q\mathbf{j} + R\mathbf{k}$.

## What Happens (Worked Example)

**What happens:**

Consider $\mathbf{F}(x, y, z) = z\mathbf{k}$ (vertical field) and the surface $S$: the disk $x^2 + y^2 \leq 1$ at $z = 2$ with upward-pointing normal.

Parameterize using polar coordinates on the disk:
$$\mathbf{r}(r, \theta) = r\cos\theta \, \mathbf{i} + r\sin\theta \, \mathbf{j} + 2\mathbf{k}, \quad r \in [0, 1], \theta \in [0, 2\pi]$$

Compute tangent vectors:
$$\frac{\partial \mathbf{r}}{\partial r} = \cos\theta \, \mathbf{i} + \sin\theta \, \mathbf{j}$$
$$\frac{\partial \mathbf{r}}{\partial \theta} = -r\sin\theta \, \mathbf{i} + r\cos\theta \, \mathbf{j}$$

Cross product (normal vector):
$$\mathbf{n} = \frac{\partial \mathbf{r}}{\partial r} \times \frac{\partial \mathbf{r}}{\partial \theta} = \begin{vmatrix} \mathbf{i} & \mathbf{j} & \mathbf{k} \\ \cos\theta & \sin\theta & 0 \\ -r\sin\theta & r\cos\theta & 0 \end{vmatrix} = r\mathbf{k}$$

The field on the surface is $\mathbf{F}(\mathbf{r}(r, \theta)) = 2\mathbf{k}$.

Flux integral:
$$\iint_S \mathbf{F} \cdot \mathbf{n} \, dS = \int_0^{2\pi} \int_0^1 (2\mathbf{k}) \cdot (r\mathbf{k}) \, dr \, d\theta = \int_0^{2\pi} \int_0^1 2r \, dr \, d\theta = \int_0^{2\pi} \left[r^2\right]_0^1 d\theta = \int_0^{2\pi} 1 \, d\theta = 2\pi$$

**Why it works:**

The flux equals $2\pi$ because: (1) the field strength is constant at $z = 2$, (2) the normal vector is vertical everywhere (aligned with the field), and (3) the disk has area $\pi$. But we integrate $2r \, dr \, d\theta$ (not just $r$) because the cross product magnitude in polar coordinates is $r$, giving flux = $2 \times \text{area} = 2\pi$.

## GATE MA Relevance

> **Why it matters in GATE MA:** Surface integrals appear in ~40% of advanced vector calculus questions (2–3 marks). GATE emphasizes flux calculations via parameterization, recognizing when surfaces are simple (graphs of functions), and using Gauss's and Stokes' theorems to convert surface integrals to volume/line integrals for faster computation.

