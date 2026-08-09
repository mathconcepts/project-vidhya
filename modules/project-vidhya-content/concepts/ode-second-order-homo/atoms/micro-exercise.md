---
id: ode-second-order-homo.micro-exercise
concept_id: ode-second-order-homo
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Solve $\frac{d^2y}{dx^2} - 4\frac{dy}{dx} + 3y = 0$. The characteristic roots are:

- **(A)** $r_1 = 1, r_2 = 3$
- **(B)** $r_1 = 1, r_2 = -3$
- **(C)** $r_1 = -1, r_2 = -3$
- **(D)** $r_1 = 2, r_2 = 2$

<details>
<summary>Answer</summary>

**A**. The characteristic equation is obtained by replacing $\frac{d^2y}{dx^2}$ with $r^2$, $\frac{dy}{dx}$ with $r$, and $y$ with $1$:
$$r^2 - 4r + 3 = 0$$

Factor:
$$(r - 1)(r - 3) = 0$$

So the roots are $r_1 = 1$ and $r_2 = 3$. Both are distinct and real.

Geometrically, these two roots correspond to two exponential modes: $e^{x}$ (growing slowly) and $e^{3x}$ (growing rapidly). The general solution is their combination.

</details>
