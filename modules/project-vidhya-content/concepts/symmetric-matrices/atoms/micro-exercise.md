---
id: symmetric-matrices.micro_exercise
concept_id: symmetric-matrices
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

**Question:** Which of the following matrices is symmetric?

(A) $\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}$

(B) $\begin{pmatrix} 1 & -2 \\ -2 & 3 \end{pmatrix}$

(C) $\begin{pmatrix} 0 & i \\ -i & 0 \end{pmatrix}$

(D) $\begin{pmatrix} 1 & 2+i \\ 2-i & 3 \end{pmatrix}$

<details><summary>Answer</summary>

**(B)** is symmetric because $$\begin{pmatrix} 1 & -2 \\ -2 & 3 \end{pmatrix}^T = \begin{pmatrix} 1 & -2 \\ -2 & 3 \end{pmatrix}.$$

(A) is not symmetric: $a_{12} = 2 \neq 3 = a_{21}$.

(C) is Hermitian ($A = A^*$), not symmetric for real matrices.

(D) is also Hermitian but not symmetric.

</details>