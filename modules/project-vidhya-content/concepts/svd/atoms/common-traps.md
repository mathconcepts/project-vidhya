---
id: svd.common_traps
concept_id: svd
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

## Common Pitfalls with SVD

**Trap 1: Confusing singular values with eigenvalues**

Singular values $\sigma_i$ of $A$ are the square roots of eigenvalues of $A^T A$, not eigenvalues of $A$ itself. Many students compute $\det(A - \lambda I)$ instead of $\det(A^T A - \lambda I)$ and get wrong answers. Eigendecomposition $A = PDP^{-1}$ only works for square matrices with enough eigenvectors; SVD works for *any* matrix, even rectangular ones.

**Trap 2: Assuming $U$ and $V$ are the same or swappable**

In $A = U \Sigma V^T$, the matrix $U$ (left singular vectors, output space) is *different* from $V$ (right singular vectors, input space). They have different dimensions if $m \neq n$. Writing $A = U \Sigma V$ without the transpose or swapping $U$ and $V$ produces nonsense.

**Trap 3: Forgetting the transpose on $V$**

The correct decomposition is $A = U \Sigma V^T$ (transpose matters). If you write $A = U \Sigma V$, you're claiming $V^T$ is orthogonal, which it is not—$V$ itself is orthogonal. This error cascades through all downstream rank and norm calculations.

**Trap 4: Misidentifying rank when singular values are tiny but nonzero**

In computation, $\sigma_i = 10^{-15}$ is machine noise, not a true nonzero singular value. Rank depends on a threshold: $\text{rank}(A, \tau) = $ count of $\sigma_i > \tau$. The problem statement should specify whether singular values are exactly zero (algebraic) or numerically tiny (numerical). Blindly rounding gives wrong rank.