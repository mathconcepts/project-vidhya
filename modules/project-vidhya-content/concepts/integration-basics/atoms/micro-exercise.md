---
id: integration-basics.micro-exercise
concept_id: integration-basics
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Evaluate $\int (5x^4 + 3x^2 - 2) \, dx$.

- **(A)** $x^5 + x^3 - 2x + C$
- **(B)** $5x^5 + 3x^3 - 2x + C$
- **(C)** $x^5 + x^3 + C$
- **(D)** $20x^3 + 6x + C$

<details>
<summary>Answer</summary>

**A**. Apply the power rule: $\int x^n \, dx = \frac{x^{n+1}}{n+1} + C$.

$$\int 5x^4 \, dx = 5 \cdot \frac{x^5}{5} = x^5$$
$$\int 3x^2 \, dx = 3 \cdot \frac{x^3}{3} = x^3$$
$$\int -2 \, dx = -2x$$

Total: $x^5 + x^3 - 2x + C$

</details>
