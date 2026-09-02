---
id: rank-nullity.micro-exercise
concept_id: rank-nullity
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Find the rank of $A = \begin{pmatrix} 1 & 2 \\ 2 & 4 \\ 3 & 6 \end{pmatrix}$.

- **(A)** 1
- **(B)** 2
- **(C)** 3
- **(D)** 0

<details>
<summary>Answer</summary>

**A**. Column 2 is exactly $2\times$ column 1: $(2,4,6)^T = 2(1,2,3)^T$, so the columns are dependent. Row-reducing confirms it: $R_2-2R_1$ and $R_3-3R_1$ both zero out, leaving one non-zero row. $\text{rank}(A) = 1$.

</details>
