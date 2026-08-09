---
id: integration-substitution.retrieval-prompt
concept_id: integration-substitution
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Evaluate $\int \sin(3x) \, dx$.

- **(A)** $-\cos(3x) + C$
- **(B)** $-\frac{1}{3}\cos(3x) + C$
- **(C)** $3\cos(3x) + C$
- **(D)** $-3\cos(3x) + C$

<details>
<summary>Answer</summary>

**B**. Let $u = 3x$, so $du = 3 \, dx$ or $dx = du/3$.

$$\int \sin(3x) \, dx = \int \sin(u) \cdot \frac{du}{3} = \frac{1}{3} \int \sin(u) \, du = \frac{1}{3}(-\cos(u)) + C = -\frac{1}{3}\cos(3x) + C$$

</details>
