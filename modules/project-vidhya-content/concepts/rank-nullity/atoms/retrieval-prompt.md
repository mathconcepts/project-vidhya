---
id: rank-nullity.retrieval-prompt
concept_id: rank-nullity
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Compute the rank of $B = \begin{pmatrix} 1 & 1 & 1 \\ 0 & 1 & 2 \\ 0 & 0 & 0 \end{pmatrix}$.

- **(A)** 0
- **(B)** 1
- **(C)** 2
- **(D)** 3

<details>
<summary>Answer</summary>

**C**. The matrix is already in row echelon form (upper triangular with a zero row at the bottom).

Count the non-zero rows: rows 1 and 2 are non-zero, row 3 is all zeros. So $\text{rank}(B) = 2$.

Alternatively, there are 2 pivot positions (one in column 1, one in column 2), confirming rank = 2.

</details>
