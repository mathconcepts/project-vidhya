---
id: root-finding.retrieval-prompt
concept_id: root-finding
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

For $f(x) = e^x - 3x = 0$, the Newton-Raphson iteration starting at $x_0 = 1$ gives $x_1 = 1 - \frac{e - 3}{e - 3}$. What is $x_1$?

- **(A)** $x_1 = 1$
- **(B)** $x_1 = 0$
- **(C)** $x_1 = 1.5$
- **(D)** Cannot be determined

<details>
<summary>Answer</summary>

**A**. Step 1: $f(x) = e^x - 3x$ and $f'(x) = e^x - 3$.
Step 2: At $x_0 = 1$: $f(1) = e - 3 ≈ 2.718 - 3 = -0.282$ and $f'(1) = e - 3 ≈ -0.282$.
Step 3: $x_1 = 1 - \frac{f(1)}{f'(1)} = 1 - \frac{e-3}{e-3} = 1 - 1 = 0$.

However, the expression given shows $x_1 = 1 - \frac{e-3}{e-3}$. If $e-3 ≠ 0$ (which it is), then $\frac{e-3}{e-3} = 1$, so $x_1 = 0$. The answer is B.

</details>
