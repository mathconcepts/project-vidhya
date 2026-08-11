---
id: integration-substitution.micro-exercise
concept_id: integration-substitution
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Evaluate $\int 3x^2 e^{x^3} \, dx$.

- **(A)** $e^{x^3} + C$
- **(B)** $x^3 e^{x^3} + C$
- **(C)** $3e^{x^3} + C$
- **(D)** $x e^{x^3} + C$

<details>
<summary>Answer</summary>

**A**. Let $u = x^3$, so $du = 3x^2 dx$.

$$\int 3x^2 e^{x^3} \, dx = \int e^u \, du = e^u + C = e^{x^3} + C$$

</details>
