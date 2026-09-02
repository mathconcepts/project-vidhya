---
id: svd.formal_definition
concept_id: svd
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Singular Value Decomposition.** For any matrix $A \in \mathbb{R}^{m \times n}$, there exist orthogonal matrices $U \in \mathbb{R}^{m \times m}$ and $V \in \mathbb{R}^{n \times n}$ (satisfying $U^T U = I$ and $V^T V = I$), and a diagonal matrix $\Sigma \in \mathbb{R}^{m \times n}$ with non-negative diagonal entries (singular values) $\sigma_1 \geq \sigma_2 \geq \cdots \geq \sigma_{\min(m,n)} \geq 0$, such that:

$$A = U \Sigma V^T$$

The singular values $\sigma_i$ quantify the "stretch" along each principal axis.

**Key properties:**

- **Rank:** $\text{rank}(A) = $ number of nonzero singular values.
- **Frobenius norm:** $\|A\|_F = \sqrt{\sum_{i=1}^{\min(m,n)} \sigma_i^2}$.
- **Spectral norm:** $\|A\|_2 = \sigma_1$ (largest singular value).
- **Connection to eigenvalues:** the singular values of $A$ are the square roots of the eigenvalues of $A^T A$: $\sigma_i^2 = \lambda_i(A^T A)$.

**Method selector.** Reach for SVD whenever $A$ is non-square, singular, or you need a low-rank approximation or a numerically stable factorization — it exists unconditionally. The tempting-but-wrong alternative is reaching for eigendecomposition on a matrix that isn't symmetric (or isn't square at all): eigenvectors need not exist or be orthogonal there, so there's no single matrix playing both the $U$ and $V$ role, and the neat "rotate–stretch–rotate" structure SVD guarantees simply isn't available.
