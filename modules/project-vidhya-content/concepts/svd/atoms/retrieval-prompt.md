---
id: svd.retrieval_prompt
concept_id: svd
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

## Recall: The SVD Rank-Norm Theorem

**Question:** State the theorem that relates singular values to rank, spectral norm, and Frobenius norm. How does the rank of $A$ relate to its singular values?

<details>
<summary>Answer</summary>

**Theorem:** For any matrix $A \in \mathbb{R}^{m \times n}$ with SVD $A = U \Sigma V^T$:

1. **Rank:** $\text{rank}(A) = $ number of nonzero singular values.
2. **Spectral Norm:** $\|A\|_2 = \sigma_1$ (largest singular value).
3. **Frobenius Norm:** $\|A\|_F = \sqrt{\sum_{i=1}^{\min(m,n)} \sigma_i^2}$.
4. **Eigenvalue Connection:** Singular values of $A$ are the square roots of eigenvalues of $A^T A$: $\sigma_i(A) = \sqrt{\lambda_i(A^T A)}$.

**Key insight:** If $A$ has rank $r$, then exactly $r$ singular values are nonzero, and the remaining $\min(m,n) - r$ are zero. SVD immediately reveals the true dimension of $A$'s image (rank) and the scale of distortion on each axis (singular values).

</details>