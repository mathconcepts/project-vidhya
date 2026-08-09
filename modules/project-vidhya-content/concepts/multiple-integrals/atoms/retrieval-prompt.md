---
id: multiple-integrals.retrieval-prompt
concept_id: multiple-integrals
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Find the volume under $z = x + y$ over the rectangular region $0 \leq x \leq 3$, $0 \leq y \leq 2$.

- **(A)** $6$
- **(B)** $12$
- **(C)** $15$
- **(D)** $20$

<details>
<summary>Answer</summary>

**C**. Volume = $\iint_R (x + y) \, dA$

$$\int_0^3 \int_0^2 (x + y) \, dy \, dx$$

Inner (w.r.t. $y$):
$$\int_0^2 (x + y) \, dy = [xy + \frac{y^2}{2}]_0^2 = 2x + 2$$

Outer (w.r.t. $x$):
$$\int_0^3 (2x + 2) \, dx = [x^2 + 2x]_0^3 = 9 + 6 = 15$$

</details>
