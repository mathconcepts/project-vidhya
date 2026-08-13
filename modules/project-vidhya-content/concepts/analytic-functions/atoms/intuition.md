---
id: analytic-functions-intuition
concept_id: analytic-functions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Analytic Functions — The Heart of Complex Analysis

A function $f(z) = u(x,y) + i\,v(x,y)$ of a complex variable $z = x + iy$ is **analytic** (also called holomorphic) at a point if it is complex-differentiable in a neighbourhood of that point.

## The Cauchy-Riemann Equations

Complex differentiability is far stronger than real differentiability. It requires:

$$\frac{\partial u}{\partial x} = \frac{\partial v}{\partial y} \qquad \text{and} \qquad \frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x}$$

If these **CR equations** hold and the partial derivatives are continuous, then $f$ is analytic.

This is both a necessary AND sufficient condition (with continuity of partials).

## Entire Functions

A function analytic **everywhere** in $\mathbb{C}$ is called **entire**:

| Function | Why entire |
|---|---|
| $e^z = e^x\cos y + i\,e^x\sin y$ | CR equations hold everywhere |
| $\sin z$, $\cos z$ | Defined via $e^{iz}$, CR verified |
| Polynomials $p(z)$ | Differentiable everywhere |

## Singular Points

A point where $f$ fails to be analytic is a **singularity**. For example:
- $f(z) = 1/z$ has a singularity at $z = 0$.
- $f(z) = |z|^2$ is **nowhere analytic** (CR fails for $z \neq 0$).

## Harmonic Functions

If $f = u + iv$ is analytic, both $u$ and $v$ individually satisfy **Laplace's equation**:

$$\nabla^2 u = \frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2} = 0, \qquad \nabla^2 v = 0$$

We say $u$ and $v$ are **harmonic** and are **harmonic conjugates** of each other. This connection is enormously useful in physics (electrostatics, fluid flow).

## Key Insight for GATE

To check analyticity of $f = u + iv$:
1. Write $u$ and $v$ as functions of $x$ and $y$.
2. Compute all four partial derivatives.
3. Check both CR equations.
4. If they hold everywhere (with continuity) — $f$ is entire. If they hold only on a curve or at isolated points — $f$ is not analytic.
