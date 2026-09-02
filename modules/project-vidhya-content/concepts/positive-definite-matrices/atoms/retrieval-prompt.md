---
id: positive-definite-matrices.retrieval-prompt
concept_id: positive-definite-matrices
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["Sylvester-criterion", "leading-principal-minors"]
---

Before checking: state Sylvester's criterion, and what a leading principal minor $D_k$ is.

<details><summary>Answer</summary>

$A$ is positive definite iff every leading principal minor $D_k=\det(A_{1:k,1:k})$ is strictly positive, $k=1,\dots,n$. $D_1=A_{11}$, $D_2$ is the top-left $2\times2$ determinant, ..., $D_n=\det(A)$.
</details>
