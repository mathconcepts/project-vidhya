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

**A**. Notice that column 2 is exactly 2 times column 1: $(2, 4, 6)^T = 2(1, 2, 3)^T$. So the two columns are linearly dependent.

Only one of them is independent, so $\text{rank}(A) = 1$.

Alternatively, perform row reduction:
$\begin{pmatrix} 1 & 2 \\ 2 & 4 \\ 3 & 6 \end{pmatrix} \xrightarrow{R_2 - 2R_1, R_3 - 3R_1} \begin{pmatrix} 1 & 2 \\ 0 & 0 \\ 0 & 0 \end{pmatrix}$.

One non-zero row, so rank = 1.

</details>
