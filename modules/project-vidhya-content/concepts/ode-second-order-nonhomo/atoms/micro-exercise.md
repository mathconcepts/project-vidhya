---
id: ode-second-order-nonhomo.micro-exercise
concept_id: ode-second-order-nonhomo
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

For the ODE $\frac{d^2y}{dx^2} + 4\frac{dy}{dx} + 4y = 8$, the homogeneous solution $y_h$ is:

- **(A)** $y_h = (C_1 + C_2 x)e^{-2x}$
- **(B)** $y_h = C_1 e^{-2x} + C_2 e^{2x}$
- **(C)** $y_h = C_1 \cos(2x) + C_2 \sin(2x)$
- **(D)** $y_h = C_1 e^{2x} + C_2 e^{-2x}$

<details>
<summary>Answer</summary>

**A**. First, solve the homogeneous ODE: $\frac{d^2y}{dx^2} + 4\frac{dy}{dx} + 4y = 0$.

**Characteristic equation:**
$$r^2 + 4r + 4 = 0$$
$$(r + 2)^2 = 0$$
$$r = -2 \text{ (repeated)}$$

For a repeated root $r = -2$, the homogeneous solution is:
$$y_h = (C_1 + C_2 x)e^{-2x}$$

This is the complementary function; the non-homogeneous term $8$ affects only the particular solution, not $y_h$.

</details>
