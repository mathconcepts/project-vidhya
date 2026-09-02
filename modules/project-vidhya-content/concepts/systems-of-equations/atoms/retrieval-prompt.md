---
id: systems-of-equations.retrieval-prompt
concept_id: systems-of-equations
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["cramers-rule", "consistency"]
---

From memory, before checking: using Cramer's rule on $2x+y=4$ and $x-y=2$, what is $x$?

- **(A)** 1
- **(B)** 2
- **(C)** 3
- **(D)** $-1$

<details>
<summary>Answer</summary>

**B**. $A = \begin{pmatrix} 2 & 1 \\ 1 & -1 \end{pmatrix}$, $\det(A) = -2-1=-3$. $A_x = \begin{pmatrix} 4 & 1 \\ 2 & -1 \end{pmatrix}$, $\det(A_x) = -4-2=-6$. $x = \det(A_x)/\det(A) = -6/-3 = 2$.

Check: $y=0$ from $x-y=2$, and $2(2)+0=4$ ✓.

</details>
