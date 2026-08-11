---
id: systems-of-equations.retrieval-prompt
concept_id: systems-of-equations
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Solve using Cramer's rule: $2x + y = 4$ and $x - y = 2$. Find $x$.

- **(A)** 1
- **(B)** 2
- **(C)** 3
- **(D)** $-1$

<details>
<summary>Answer</summary>

**B**. Use Cramer's rule: $x = \frac{\det(A_x)}{\det(A)}$, where $A$ is the coefficient matrix and $A_x$ replaces the first column with $b$.

$A = \begin{pmatrix} 2 & 1 \\ 1 & -1 \end{pmatrix}$, so $\det(A) = 2(-1) - 1(1) = -2 - 1 = -3$.

$A_x = \begin{pmatrix} 4 & 1 \\ 2 & -1 \end{pmatrix}$, so $\det(A_x) = 4(-1) - 1(2) = -4 - 2 = -6$.

$x = \frac{-6}{-3} = 2$.

Verify: If $x = 2$, then from the second equation: $2 - y = 2 \implies y = 0$. Check first equation: $2(2) + 0 = 4$ ✓

</details>
