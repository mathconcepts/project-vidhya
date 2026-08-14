---
id: positive-definite-matrices.retrieval-prompt
concept_id: positive-definite-matrices
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

**Question:** State Sylvester's criterion for testing whether a symmetric matrix $A$ is positive definite. What are the leading principal minors?

<details><summary>Answer</summary>

**Sylvester's Criterion:** A symmetric $n \times n$ matrix $A$ is positive definite if and only if **all $n$ leading principal minors are strictly positive**.

The $k$-th leading principal minor is:
$$D_k = \det(A_{1:k, 1:k})$$
where $A_{1:k, 1:k}$ denotes the top-left $k \times k$ submatrix of $A$.

In other words:
- $D_1 = A_{11}$
- $D_2 = \det\begin{pmatrix} A_{11} & A_{12} \\ A_{21} & A_{22} \end{pmatrix}$
- $D_n = \det(A)$ (the full determinant)

**Condition:** $D_k > 0$ for all $k = 1, 2, \ldots, n$ ⟺ $A$ is positive definite.

This criterion avoids computing eigenvalues and is the standard computational test in GATE.

</details>