# Gauss Divergence Theorem

> GATE Engineering Mathematics | Vector Calculus | high frequency | difficulty: 0.7

## Intuition First

The Gauss Divergence Theorem measures the total "outflow" of a vector field through a closed surface by integrating the field's "source strength" (divergence) throughout the enclosed volume. Imagine a balloon filled with air—the total air escaping through the rubber surface equals the total air pumped into the balloon by sources inside.

## Core Definition

**Gauss Divergence Theorem**: For a closed surface $S$ (with outward-pointing normal $\mathbf{n}$) bounding a volume $V$, and a vector field $\mathbf{F}$ differentiable on $V$:
$$\iint_S \mathbf{F} \cdot \mathbf{n} \, dS = \iiint_V \nabla \cdot \mathbf{F} \, dV$$

The left side is the flux (flow) through the closed surface; the right side is the integral of divergence (source density) inside the volume. The theorem converts a surface integral into a volume integral (often simpler).

**Divergence Recap**: $\nabla \cdot \mathbf{F} = \frac{\partial P}{\partial x} + \frac{\partial Q}{\partial y} + \frac{\partial R}{\partial z}$ (scalar field indicating local expansion/contraction).

## What Happens (Worked Example)

**What happens:**

Consider $\mathbf{F}(x, y, z) = x\mathbf{i} + y\mathbf{j} + z\mathbf{k}$ (radial field), and $V$: the unit ball $x^2 + y^2 + z^2 \leq 1$ with boundary $S$: the unit sphere.

**Method 1: Surface integral (flux through sphere)**
On the unit sphere, the outward normal is $\mathbf{n} = (x, y, z)$ (radial direction).

$$\mathbf{F} \cdot \mathbf{n} = (x, y, z) \cdot (x, y, z) = x^2 + y^2 + z^2 = 1$$

(On the sphere surface, the radius equals 1, so $x^2 + y^2 + z^2 = 1$.)

$$\iint_S \mathbf{F} \cdot \mathbf{n} \, dS = \iint_S 1 \, dS = \text{(surface area of unit sphere)} = 4\pi$$

**Method 2: Volume integral (divergence inside)**
Compute divergence:
$$\nabla \cdot \mathbf{F} = \frac{\partial x}{\partial x} + \frac{\partial y}{\partial y} + \frac{\partial z}{\partial z} = 1 + 1 + 1 = 3$$

Integrate over the ball:
$$\iiint_V 3 \, dV = 3 \times \text{(volume of unit ball)} = 3 \times \frac{4\pi}{3} = 4\pi$$ ✓

**Why it works:**

The radial field $\mathbf{F} = (x, y, z)$ has constant divergence 3 everywhere inside the ball—it's uniformly expanding. The total expansion integrated over the volume (method 2) equals the total flux leaking through the boundary (method 1). This is the fundamental conservation law: what's created inside must escape outside.

## GATE MA Relevance

> **Why it matters in GATE MA:** The Gauss Divergence Theorem appears in ~1–2 GATE questions (2–3 marks each), often as the workhorse for computing flux through closed surfaces. Typical pattern: "Find the flux of $\mathbf{F}$ through a closed cube/sphere." Novices parameterize all six faces of the cube; experts compute $\iiint_V \nabla \cdot \mathbf{F} \, dV$ in seconds. Key skills: (1) recognizing closed surfaces, (2) computing divergence, (3) integrating divergence over standard volumes (sphere, cube, cylinder).

