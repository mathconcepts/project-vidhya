---
id: least-squares.retrieval_prompt
concept_id: least-squares
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

**Question:** State the normal equations for finding the least squares solution to an overdetermined system $Ax = b$, and explain the orthogonality condition they impose.

<details>
<summary>Answer</summary>

The normal equations are:
$$A^T A \hat{x} = A^T b$$

If $A$ has full column rank, the unique solution is:
$$\hat{x} = (A^T A)^{-1} A^T b$$

The orthogonality condition: the residual $b - A\hat{x}$ is perpendicular to $\text{col}(A)$, expressed as $A^T(b - A\hat{x}) = 0$, which rearranges to give the normal equations. This means no further reduction in $\|b - A\hat{x}\|^2$ is possible by any change in $\hat{x}$.

</details>