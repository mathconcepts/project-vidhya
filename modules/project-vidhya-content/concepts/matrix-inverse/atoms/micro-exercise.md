---
id: matrix-inverse.micro-exercise
concept_id: matrix-inverse
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Find the inverse of $A = \begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}$.

- **(A)** $\begin{pmatrix} 1 & -2 \\ 0 & 1 \end{pmatrix}$
- **(B)** $\begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}$
- **(C)** $\begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$
- **(D)** $\begin{pmatrix} 1 & 0 \\ -2 & 1 \end{pmatrix}$

<details>
<summary>Answer</summary>

**A**. First, verify invertibility: $\det(A) = 1(1) - 2(0) = 1 \neq 0$, so $A$ is invertible.

Using the 2×2 formula: $A^{-1} = \frac{1}{\det(A)} \begin{pmatrix} d & -b \\ -c & a \end{pmatrix} = \frac{1}{1} \begin{pmatrix} 1 & -2 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} 1 & -2 \\ 0 & 1 \end{pmatrix}$.

Verify: $AA^{-1} = \begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix} \begin{pmatrix} 1 & -2 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix}$ ✓

</details>
