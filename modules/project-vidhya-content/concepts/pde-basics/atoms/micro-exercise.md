---
id: pde-basics.micro-exercise
concept_id: pde-basics
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Classify the PDE $\frac{\partial u}{\partial t} = 2\frac{\partial^2 u}{\partial x^2}$. What type is it?

- **(A)** Heat equation (parabolic)
- **(B)** Wave equation (hyperbolic)
- **(C)** Laplace equation (elliptic)
- **(D)** Advection equation (parabolic)

<details>
<summary>Answer</summary>

**A**. The given PDE has the form $\frac{\partial u}{\partial t} = \alpha \frac{\partial^2 u}{\partial x^2}$ with $\alpha = 2 > 0$.

This is the **heat (diffusion) equation**, a parabolic PDE. It models temperature diffusion in a rod, concentration diffusion in a medium, or similar diffusive processes.

Key feature: First-order time derivative paired with second-order spatial derivative. This leads to exponential decay of high-frequency modes (as we saw in the explainer example).

The wave equation (hyperbolic) has the form $\frac{\partial^2 u}{\partial t^2} = c^2 \frac{\partial^2 u}{\partial x^2}$ (second-order time, oscillatory).

The Laplace equation (elliptic) has the form $\frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2} = 0$ (steady-state, no time dependence).

</details>
