# Divergence & Curl

> GATE Engineering Mathematics | Vector Calculus | high frequency | difficulty: 0.5

## Intuition First

**Divergence** measures how much a vector field is "spreading out" at a point—like water flowing away from a spring (positive divergence) or toward a drain (negative). **Curl** measures the "swirl" or rotation of the field—like the spinning motion of water going down a drain. Together, they characterize the local behavior of any vector field.

## Core Definition

**Divergence**: The divergence of a vector field $\mathbf{F} = P\mathbf{i} + Q\mathbf{j} + R\mathbf{k}$ is a scalar:
$$\nabla \cdot \mathbf{F} = \frac{\partial P}{\partial x} + \frac{\partial Q}{\partial y} + \frac{\partial R}{\partial z}$$

Geometrically, divergence measures the net outward flux per unit volume.

**Curl**: The curl of a vector field $\mathbf{F}$ is a vector:
$$\nabla \times \mathbf{F} = \begin{vmatrix} \mathbf{i} & \mathbf{j} & \mathbf{k} \\ \frac{\partial}{\partial x} & \frac{\partial}{\partial y} & \frac{\partial}{\partial z} \\ P & Q & R \end{vmatrix} = \left(\frac{\partial R}{\partial y} - \frac{\partial Q}{\partial z}\right)\mathbf{i} - \left(\frac{\partial R}{\partial x} - \frac{\partial P}{\partial z}\right)\mathbf{j} + \left(\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}\right)\mathbf{k}$$

The direction of $\nabla \times \mathbf{F}$ points along the axis of rotation (right-hand rule); its magnitude is twice the angular velocity of the swirl.

## What Happens (Worked Example)

**What happens:**

Consider $\mathbf{F}(x, y, z) = xy\mathbf{i} + y^2\mathbf{j} + z\mathbf{k}$.

**Divergence:**
$$\nabla \cdot \mathbf{F} = \frac{\partial(xy)}{\partial x} + \frac{\partial(y^2)}{\partial y} + \frac{\partial(z)}{\partial z} = y + 2y + 1 = 3y + 1$$

At point $(1, 2, 0)$: $\nabla \cdot \mathbf{F}(1, 2, 0) = 3(2) + 1 = 7 > 0$ — net outward flux (source).

**Curl:**
$$\nabla \times \mathbf{F} = \begin{vmatrix} \mathbf{i} & \mathbf{j} & \mathbf{k} \\ \frac{\partial}{\partial x} & \frac{\partial}{\partial y} & \frac{\partial}{\partial z} \\ xy & y^2 & z \end{vmatrix}$$

$= \left(\frac{\partial z}{\partial y} - \frac{\partial y^2}{\partial z}\right)\mathbf{i} - \left(\frac{\partial z}{\partial x} - \frac{\partial xy}{\partial z}\right)\mathbf{j} + \left(\frac{\partial y^2}{\partial x} - \frac{\partial xy}{\partial y}\right)\mathbf{k}$

$= (0 - 0)\mathbf{i} - (0 - 0)\mathbf{j} + (0 - x)\mathbf{k} = -x\mathbf{k}$

At point $(2, 1, 3)$: $\nabla \times \mathbf{F}(2, 1, 3) = -2\mathbf{k}$ — rotation around the $z$-axis with magnitude 2 (clockwise looking down).

**Why it works:**

Divergence aggregates how each component changes in its own direction: the $x$-component's change in $x$ (expansion/contraction along $x$), plus $y$-component's change in $y$, plus $z$-component's change in $z$. Curl captures "the net rotation" by comparing cross-component derivatives—e.g., if $\frac{\partial R}{\partial y} > \frac{\partial Q}{\partial z}$, the field rotates around the $x$-axis.

## GATE MA Relevance

> **Why it matters in GATE MA:** Divergence and curl are tested in ~70% of vector calculus questions (2–3 marks each). GATE focuses on rapid calculation of $\nabla \cdot \mathbf{F}$ and $\nabla \times \mathbf{F}$ for given fields, identification of irrotational fields ($\nabla \times \mathbf{F} = 0$), and using these operators to set up Stokes' and Gauss' theorems.

