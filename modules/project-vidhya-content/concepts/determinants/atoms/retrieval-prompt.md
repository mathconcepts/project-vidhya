---
id: determinants.retrieval-prompt
concept_id: determinants
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["cofactor-expansion", "determinant"]
---

From memory, before checking: compute $\det \begin{pmatrix} 2 & 1 & 0 \\ 1 & 3 & 2 \\ 0 & 1 & 1 \end{pmatrix}$ by expanding along the first row.

- **(A)** $-2$
- **(B)** $0$
- **(C)** $1$
- **(D)** $4$

<details>
<summary>Answer</summary>

**C**. Expand along row 1: $\det(A) = 2\begin{vmatrix} 3 & 2 \\ 1 & 1 \end{vmatrix} - 1\begin{vmatrix} 1 & 2 \\ 0 & 1 \end{vmatrix} + 0$.

$\begin{vmatrix} 3 & 2 \\ 1 & 1 \end{vmatrix} = 3(1)-2(1) = 1$, and $\begin{vmatrix} 1 & 2 \\ 0 & 1 \end{vmatrix} = 1(1)-2(0) = 1$.

$$\det(A) = 2(1) - 1(1) + 0 = 1$$

</details>
