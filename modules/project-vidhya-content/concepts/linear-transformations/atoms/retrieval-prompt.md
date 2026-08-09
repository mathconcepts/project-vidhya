---
id: linear-transformations.retrieval-prompt
concept_id: linear-transformations
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Find the matrix representation of the linear transformation $T: \mathbb{R}^2 \to \mathbb{R}^2$ defined by $T(x, y) = (3x - y, x + 2y)$.

- **(A)** $\begin{pmatrix} 3 & -1 \\ 1 & 2 \end{pmatrix}$
- **(B)** $\begin{pmatrix} 3 & 1 \\ -1 & 2 \end{pmatrix}$
- **(C)** $\begin{pmatrix} 1 & 2 \\ 3 & -1 \end{pmatrix}$
- **(D)** $\begin{pmatrix} 3 & 2 \\ -1 & 1 \end{pmatrix}$

<details>
<summary>Answer</summary>

**A**. The matrix columns are the images of the standard basis vectors.

$T(1, 0) = (3(1) - 0, 1 + 2(0)) = (3, 1)$ → first column

$T(0, 1) = (3(0) - 1, 0 + 2(1)) = (-1, 2)$ → second column

So the matrix is $A = \begin{pmatrix} 3 & -1 \\ 1 & 2 \end{pmatrix}$.

Verify: $\begin{pmatrix} 3 & -1 \\ 1 & 2 \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 3x - y \\ x + 2y \end{pmatrix}$ ✓

</details>
