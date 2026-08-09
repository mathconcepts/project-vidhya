---
id: improper-integrals.micro-exercise
concept_id: improper-integrals
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Evaluate $\int_1^{\infty} \frac{1}{x} \, dx$.

- **(A)** $0$
- **(B)** $1$
- **(C)** Diverges
- **(D)** $\ln(\infty)$

<details>
<summary>Answer</summary>

**C**. $$\int_1^{\infty} \frac{1}{x} dx = \lim_{t \to \infty} \int_1^t \frac{1}{x} dx = \lim_{t \to \infty} [\ln(x)]_1^t$$

$$= \lim_{t \to \infty} (\ln(t) - \ln(1)) = \lim_{t \to \infty} \ln(t) = \infty$$

The integral diverges.

</details>
