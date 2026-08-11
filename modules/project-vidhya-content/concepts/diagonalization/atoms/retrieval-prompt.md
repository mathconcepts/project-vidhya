---
id: diagonalization.retrieval-prompt
concept_id: diagonalization
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

If $A = \begin{pmatrix} 2 & 0 \\ 0 & 3 \end{pmatrix}$, find $A^{100}$.

- **(A)** $\begin{pmatrix} 2^{100} & 0 \\ 0 & 3^{100} \end{pmatrix}$
- **(B)** $\begin{pmatrix} 100 & 0 \\ 0 & 100 \end{pmatrix}$
- **(C)** $\begin{pmatrix} 2 & 0 \\ 0 & 3 \end{pmatrix}$
- **(D)** $\begin{pmatrix} 200 & 0 \\ 0 & 300 \end{pmatrix}$

<details>
<summary>Answer</summary>

**A**. Since $A$ is already diagonal with $D = \begin{pmatrix} 2 & 0 \\ 0 & 3 \end{pmatrix}$, we have:
$A^{100} = D^{100} = \begin{pmatrix} 2^{100} & 0 \\ 0 & 3^{100} \end{pmatrix}$.

For a diagonal matrix, raising to a power just raises each diagonal entry to that power.

</details>
