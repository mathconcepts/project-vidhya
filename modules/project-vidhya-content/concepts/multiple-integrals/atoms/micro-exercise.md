---
id: multiple-integrals.micro-exercise
concept_id: multiple-integrals
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Evaluate $\int_0^1 \int_0^2 (x + y) \, dx \, dy$.

- **(A)** $1$
- **(B)** $2$
- **(C)** $3$
- **(D)** $4$

<details>
<summary>Answer</summary>

**C**. Inner integral (w.r.t. $x$):
$$\int_0^2 (x + y) \, dx = [\frac{x^2}{2} + xy]_0^2 = (2 + 2y) - 0 = 2 + 2y$$

Outer integral:
$$\int_0^1 (2 + 2y) \, dy = [2y + y^2]_0^1 = 2 + 1 = 3$$

</details>
