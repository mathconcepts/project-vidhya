---
id: matrix-operations.retrieval-prompt
concept_id: matrix-operations
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["non-commutativity", "matrix-multiplication"]
---

From memory, before checking: for $A = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ and $B = \begin{pmatrix} 2 & -1 \\ 0 & 1 \end{pmatrix}$, what is $AB - BA$?

- **(A)** $\begin{pmatrix} 0 & 0 \\ 0 & 0 \end{pmatrix}$
- **(B)** $\begin{pmatrix} 0 & -1 \\ 0 & 0 \end{pmatrix}$
- **(C)** $\begin{pmatrix} 2 & 0 \\ 0 & -2 \end{pmatrix}$
- **(D)** $\begin{pmatrix} 1 & -1 \\ 0 & 1 \end{pmatrix}$

<details>
<summary>Answer</summary>

**B**. $AB = \begin{pmatrix} 1(2)+1(0) & 1(-1)+1(1) \\ 0(2)+1(0) & 0(-1)+1(1) \end{pmatrix} = \begin{pmatrix} 2 & 0 \\ 0 & 1 \end{pmatrix}$.

$BA = \begin{pmatrix} 2(1)+(-1)(0) & 2(1)+(-1)(1) \\ 0(1)+1(0) & 0(1)+1(1) \end{pmatrix} = \begin{pmatrix} 2 & 1 \\ 0 & 1 \end{pmatrix}$.

$$AB - BA = \begin{pmatrix} 2 & 0 \\ 0 & 1 \end{pmatrix} - \begin{pmatrix} 2 & 1 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} 0 & -1 \\ 0 & 0 \end{pmatrix}$$

Not the zero matrix — a direct demonstration that $A$ and $B$ don't commute here.

</details>
