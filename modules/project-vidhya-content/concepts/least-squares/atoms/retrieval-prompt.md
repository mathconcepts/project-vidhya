---
id: least-squares.retrieval_prompt
concept_id: least-squares
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["normal-equations", "orthogonal-projection"]
---

Before checking: state the normal equations for the least squares solution of $Ax=b$, and say what orthogonality condition forces them.

<details><summary>Answer</summary>

$A^TA\hat x = A^Tb$. This comes from requiring the residual $b-A\hat x$ to be orthogonal to $\text{col}(A)$: $A^T(b-A\hat x)=0$ rearranges directly into the normal equations. If $A$ has full column rank, $\hat x=(A^TA)^{-1}A^Tb$ is unique.
</details>
