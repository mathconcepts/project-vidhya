---
id: linear-independence.micro-exercise
concept_id: linear-independence
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

**Question (1 mark).** Which of the following sets of vectors in $\mathbb{R}^2$ is linearly independent?

(A) $\left\{ \begin{pmatrix} 1 \\ 2 \end{pmatrix}, \begin{pmatrix} 2 \\ 4 \end{pmatrix} \right\}$

(B) $\left\{ \begin{pmatrix} 1 \\ 0 \end{pmatrix}, \begin{pmatrix} 0 \\ 1 \end{pmatrix} \right\}$

(C) $\left\{ \begin{pmatrix} 1 \\ 1 \end{pmatrix}, \begin{pmatrix} 1 \\ 1 \end{pmatrix} \right\}$

(D) $\left\{ \begin{pmatrix} 2 \\ 3 \end{pmatrix}, \begin{pmatrix} 4 \\ 6 \end{pmatrix} \right\}$

<details>
<summary>Answer</summary>

**Answer: (B)**

**Explanation:**
- **(A)** $\begin{pmatrix} 2 \\ 4 \end{pmatrix} = 2 \begin{pmatrix} 1 \\ 2 \end{pmatrix}$, so dependent.
- **(B)** The standard basis vectors: $c_1 \begin{pmatrix} 1 \\ 0 \end{pmatrix} + c_2 \begin{pmatrix} 0 \\ 1 \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \end{pmatrix}$ implies $c_1 = c_2 = 0$ only. **Independent.**
- **(C)** Identical vectors: clearly dependent.
- **(D)** $\begin{pmatrix} 4 \\ 6 \end{pmatrix} = 2 \begin{pmatrix} 2 \\ 3 \end{pmatrix}$, so dependent.

</details>