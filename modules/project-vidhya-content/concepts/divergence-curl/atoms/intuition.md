---
id: divergence-curl-intuition
concept_id: divergence-curl
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Divergence and Curl — The Two Local Measures

Every vector field has two local signatures: how much it **spreads** at a point (divergence), and how much it **rotates** at a point (curl).

---

## Divergence — Sources and Sinks

The **divergence** measures net outflow per unit volume:

$$\nabla \cdot \mathbf{F} = \frac{\partial F_x}{\partial x} + \frac{\partial F_y}{\partial y} + \frac{\partial F_z}{\partial z}$$

- $\nabla \cdot \mathbf{F} > 0$ at a point: fluid is being **created** there (source).
- $\nabla \cdot \mathbf{F} < 0$ at a point: fluid is being **destroyed** there (sink).
- $\nabla \cdot \mathbf{F} = 0$ everywhere: **incompressible** flow (no sources or sinks).

---

## Curl — Rotation

The **curl** measures infinitesimal rotation (vorticity):

$$\nabla \times \mathbf{F} = \begin{vmatrix} \hat{i} & \hat{j} & \hat{k} \\ \partial/\partial x & \partial/\partial y & \partial/\partial z \\ F_x & F_y & F_z \end{vmatrix}$$

Expanding:

$$\nabla \times \mathbf{F} = \left(\frac{\partial F_z}{\partial y} - \frac{\partial F_y}{\partial z}\right)\hat{i} - \left(\frac{\partial F_z}{\partial x} - \frac{\partial F_x}{\partial z}\right)\hat{j} + \left(\frac{\partial F_y}{\partial x} - \frac{\partial F_x}{\partial y}\right)\hat{k}$$

- $\nabla \times \mathbf{F} \neq \mathbf{0}$: the field has local rotation (a tiny paddle wheel would spin).
- $\nabla \times \mathbf{F} = \mathbf{0}$: irrotational field (no net rotation anywhere).

---

## Two Universal Identities — Memorize These

$$\nabla \cdot (\nabla \times \mathbf{F}) = 0 \qquad \text{(divergence of curl is always zero)}$$

$$\nabla \times (\nabla f) = \mathbf{0} \qquad \text{(curl of gradient is always zero)}$$

These identities hold for any smooth $\mathbf{F}$ or scalar $f$. They appear directly on GATE as "true/false" MCQs.

---

## The Laplacian

The **Laplacian** of a scalar field $f$ combines both operations:

$$\nabla^2 f = \nabla \cdot (\nabla f) = \frac{\partial^2 f}{\partial x^2} + \frac{\partial^2 f}{\partial y^2} + \frac{\partial^2 f}{\partial z^2}$$

A **harmonic function** satisfies $\nabla^2 f = 0$ (Laplace's equation — arises in steady-state heat, electrostatics).

---

## Quick Checklist

| Quantity | Formula | Physical meaning |
|---|---|---|
| $\nabla \cdot \mathbf{F}$ | $\partial_x F_x + \partial_y F_y + \partial_z F_z$ | Sources/sinks per unit volume |
| $\nabla \times \mathbf{F}$ | Determinant form | Rotation/vorticity |
| $\nabla^2 f$ | $\partial_{xx}f + \partial_{yy}f + \partial_{zz}f$ | Net curvature (Laplacian) |
| $\nabla \cdot (\nabla \times \mathbf{F})$ | Always $0$ | Identity |
| $\nabla \times (\nabla f)$ | Always $\mathbf{0}$ | Identity |

> **GATE tip:** If asked "which of the following is always zero" — both $\nabla \cdot (\nabla \times \mathbf{F})$ and $\nabla \times (\nabla f)$ are correct. Distinguish them from $\nabla \times \mathbf{F} = 0$ (not always true).
