---
id: integration-by-parts.micro-exercise
concept_id: integration-by-parts
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Evaluate $\int x \sin(x) \, dx$.

- **(A)** $-x \cos(x) + \sin(x) + C$
- **(B)** $x \cos(x) - \sin(x) + C$
- **(C)** $-x \cos(x) - \sin(x) + C$
- **(D)** $x \sin(x) - \cos(x) + C$

<details>
<summary>Answer</summary>

**A**. Use integration by parts: Let $u = x$, $dv = \sin(x) dx$.

$du = dx$, $v = -\cos(x)$

$$\int x \sin(x) \, dx = x(-\cos(x)) - \int (-\cos(x)) \, dx$$
$$= -x \cos(x) + \int \cos(x) \, dx = -x \cos(x) + \sin(x) + C$$

</details>
