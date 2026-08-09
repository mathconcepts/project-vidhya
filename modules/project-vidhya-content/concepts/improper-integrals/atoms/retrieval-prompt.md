---
id: improper-integrals.retrieval-prompt
concept_id: improper-integrals
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Does $\int_1^{\infty} \frac{1}{x^p} \, dx$ converge for $p = 0.5$?

- **(A)** Converges
- **(B)** Diverges
- **(C)** Converges to $p$
- **(D)** Undefined

<details>
<summary>Answer</summary>

**B**. For p-integrals $\int_1^{\infty} \frac{1}{x^p} dx$:
- Converges if $p > 1$
- Diverges if $p \leq 1$

Since $p = 0.5 < 1$, the integral diverges.

Check: $\int_1^{\infty} \frac{1}{\sqrt{x}} dx = \lim_{t \to \infty} [2\sqrt{x}]_1^t = \lim_{t \to \infty} (2\sqrt{t} - 2) = \infty$

</details>
