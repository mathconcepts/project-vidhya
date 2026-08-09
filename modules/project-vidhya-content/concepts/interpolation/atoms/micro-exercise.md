---
id: interpolation.micro-exercise
concept_id: interpolation
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Given the points $(0, 1)$, $(1, 3)$, find the Lagrange interpolating polynomial and evaluate it at $x = 0.5$.

- **(A)** $P(0.5) = 1.5$
- **(B)** $P(0.5) = 2$
- **(C)** $P(0.5) = 2.5$
- **(D)** $P(0.5) = 3$

<details>
<summary>Answer</summary>

**B**. For two points, the interpolating polynomial is linear: $P(x) = y_0 L_0(x) + y_1 L_1(x)$, where $L_0(x) = \frac{x - x_1}{x_0 - x_1} = \frac{x - 1}{0 - 1} = 1 - x$ and $L_1(x) = \frac{x - x_0}{x_1 - x_0} = \frac{x - 0}{1 - 0} = x$.

So $P(x) = 1 \cdot (1 - x) + 3 \cdot x = 1 - x + 3x = 1 + 2x$.

At $x = 0.5$: $P(0.5) = 1 + 2(0.5) = 1 + 1 = 2$.

</details>
