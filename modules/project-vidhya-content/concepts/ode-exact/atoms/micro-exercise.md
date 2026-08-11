---
id: ode-exact.micro-exercise
concept_id: ode-exact
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Check if the equation $(3x^2 + 2y) dx + (2x + 4y^3) dy = 0$ is exact.

- **(A)** Exact, because $\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x} = 2$
- **(B)** Not exact, because $\frac{\partial M}{\partial y} \neq \frac{\partial N}{\partial x}$
- **(C)** Exact, because $M(x, y) + N(x, y) = 3x^2 + 2y + 2x + 4y^3$
- **(D)** Not exact; requires integrating factor

<details>
<summary>Answer</summary>

**A**. For $M(x, y) dx + N(x, y) dy = 0$ to be exact, we need $\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x}$.

**Given:** $M(x, y) = 3x^2 + 2y$, $N(x, y) = 2x + 4y^3$.

**Compute partial derivatives:**
$$\frac{\partial M}{\partial y} = \frac{\partial}{\partial y}(3x^2 + 2y) = 2$$
$$\frac{\partial N}{\partial x} = \frac{\partial}{\partial x}(2x + 4y^3) = 2$$

Since $\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x} = 2$, the equation is **exact**.

Geometrically, this means there exists a potential function $F(x, y)$ whose level curves are the solution curves.

</details>
