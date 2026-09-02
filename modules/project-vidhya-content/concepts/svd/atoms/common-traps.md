---
id: svd.common_traps
concept_id: svd
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1 — Confusing singular values with eigenvalues.** Singular values ($\sigma_i$) are not the same thing as eigenvalues (the special numbers describing how a square matrix stretches its own eigenvector directions). The singular values of $A$ are actually the square roots of the eigenvalues of $A^TA$, a related but different matrix. This matters because eigendecomposition (breaking a matrix into eigenvalues and eigenvectors) only works for a square matrix with enough eigenvectors, while SVD (singular value decomposition) works for *any* matrix, rectangular ones included.

**Trap 2 — Assuming $U$ and $V$ are the same or swappable.** In $A=U\Sigma V^T$, $U$ and $V$ are two different matrices doing two different jobs: $U$ describes directions in the output space, $V$ describes directions in the input space. When the matrix isn't square ($m\neq n$), $U$ and $V$ even come out different sizes — so you can't casually swap one in for the other.

**Trap 3 — Forgetting the transpose on $V$.** The decomposition is $A=U\Sigma V^T$, with a transpose on $V$ — not $A=U\Sigma V$. Drop the transpose and you're silently claiming $V^T$ is the orthogonal matrix (one satisfying $Q^TQ=I$), when really it's $V$ itself that has that property.

**Trap 4 — Misreading a tiny nonzero singular value as rank.** Rank is the number of genuinely independent directions a matrix uses. In real computation, a singular value like $\sigma_i=10^{-15}$ is usually just numerical noise — rounding error, not a real direction. So rank is worked out against a threshold instead: $\text{rank}(A,\tau)=$ the count of $\sigma_i>\tau$. Blindly counting every nonzero-looking $\sigma_i$, noise included, gives the wrong rank.
