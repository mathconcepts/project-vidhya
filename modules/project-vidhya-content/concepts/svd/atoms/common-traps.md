---
id: svd.common_traps
concept_id: svd
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1 — Confusing singular values with eigenvalues.** $\sigma_i$ of $A$ are the square roots of eigenvalues of $A^TA$, not eigenvalues of $A$ itself. Eigendecomposition needs a square matrix with enough eigenvectors; SVD works for *any* matrix, rectangular included.

**Trap 2 — Assuming $U$ and $V$ are the same or swappable.** In $A=U\Sigma V^T$, $U$ (output space) and $V$ (input space) are different matrices, with different dimensions when $m\neq n$.

**Trap 3 — Forgetting the transpose on $V$.** The decomposition is $A=U\Sigma V^T$, not $A=U\Sigma V$. Dropping the transpose claims $V^T$ is orthogonal when it's really $V$ that is.

**Trap 4 — Misreading a tiny nonzero singular value as rank.** In computation, $\sigma_i=10^{-15}$ is often numerical noise. Rank depends on a threshold: $\text{rank}(A,\tau)=$ count of $\sigma_i>\tau$; blindly counting anything nonzero gives the wrong rank.
