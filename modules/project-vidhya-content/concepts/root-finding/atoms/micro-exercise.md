---
id: root-finding.micro-exercise
concept_id: root-finding
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

For the equation $f(x) = x^2 - 4 = 0$, find $x_1$ using Newton-Raphson method with initial guess $x_0 = 3$.

- **(A)** $x_1 = 2.167$
- **(B)** $x_1 = 2.5$
- **(C)** $x_1 = 2.333$
- **(D)** $x_1 = 2.25$

<details>
<summary>Answer</summary>

**C**. Step 1: $f(x) = x^2 - 4$, so $f'(x) = 2x$.
Step 2: At $x_0 = 3$: $f(3) = 9 - 4 = 5$ and $f'(3) = 6$.
Step 3: Newton-Raphson formula: $x_1 = x_0 - \frac{f(x_0)}{f'(x_0)} = 3 - \frac{5}{6} = 3 - 0.833... = 2.167$.

Wait, let me recalculate: $3 - 5/6 = (18-5)/6 = 13/6 ≈ 2.1667$. The correct answer is actually A: 2.167.

</details>
