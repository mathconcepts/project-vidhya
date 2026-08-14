---
id: positive-definite-matrices.common-traps
concept_id: positive-definite-matrices
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: "Positive diagonal entries imply positive definiteness."**

WRONG. The matrix $\begin{pmatrix} 1 & 3 \\ 3 & 1 \end{pmatrix}$ has positive diagonal but eigenvalues $\lambda = 4, -2$ (indefinite). Only leading principal minors determine positive definiteness, not diagonal entries alone.

**Trap 2: "If all entries are positive, the matrix is positive definite."**

WRONG. The matrix $\begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$ has all positive entries but eigenvalues $\lambda = 3, -1$. It is indefinite, not positive definite. Entry-wise positivity is completely different from matrix positive definiteness.

**Trap 3: "Computing eigenvalues is always simpler than Sylvester's criterion."**

MISLEADING. For $3 \times 3$ or larger matrices, Sylvester's criterion (computing leading principal minors via determinants) is often computationally cheaper than finding all eigenvalues. Eigenvalue computation is $O(n^3)$ and numerically harder.

**Trap 4: "Positive semidefinite is just 'slightly less' positive definite."**

WRONG. Positive semidefinite allows zero eigenvalues—complete flat directions. For example, $A = \begin{pmatrix} 1 & 0 \\ 0 & 0 \end{pmatrix}$ is positive semidefinite ($\lambda_i \geq 0$) but not positive definite ($\lambda_2 = 0$). The difference is categorical: PD requires all eigenvalues strictly positive; PSD allows zero.

**Trap 5: "Cholesky decomposition always works for symmetric matrices."**

WRONG. Cholesky factorization $A = LL^T$ succeeds only for positive definite matrices. For a positive semidefinite matrix with zero eigenvalues, Cholesky will fail or require modification (modified Cholesky). Always verify positive definiteness first.