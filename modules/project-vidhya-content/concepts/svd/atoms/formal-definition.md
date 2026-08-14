---
id: svd.formal_definition
concept_id: svd
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

## Singular Value Decomposition

**Definition:** For any matrix $A \in \mathbb{R}^{m \times n}$, there exist orthogonal matrices $U \in \mathbb{R}^{m \times m}$ and $V \in \mathbb{R}^{n \times n}$ (satisfying $U^T U = I$ and $V^T V = I$), and a diagonal matrix $\Sigma \in \mathbb{R}^{m \times n}$ with non-negative diagonal entries (singular values) $\sigma_1 \geq \sigma_2 \geq \cdots \geq \sigma_{\min(m,n)} \geq 0$, such that:

$$A = U \Sigma V^T$$

The singular values $\sigma_i$ quantify the "stretch" along each principal axis.

**Key Properties:**

- **Rank:** $\text{rank}(A) = $ number of nonzero singular values.
- **Frobenius Norm:** $\|A\|_F = \sqrt{\sum_{i=1}^{\min(m,n)} \sigma_i^2}$.
- **Spectral Norm:** $\|A\|_2 = \sigma_1$ (largest singular value).
- **Connection to Eigenvalues:** The singular values of $A$ are the square roots of the eigenvalues of $A^T A$: $\sigma_i^2 = \lambda_i(A^T A)$.