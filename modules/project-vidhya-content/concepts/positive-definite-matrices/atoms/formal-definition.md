---
id: positive-definite-matrices.formal-definition
concept_id: positive-definite-matrices
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

An $n \times n$ real symmetric matrix $A$ is **positive definite** if $\mathbf{x}^T A \mathbf{x} > 0$ for all nonzero vectors $\mathbf{x} \in \mathbb{R}^n$. Equivalently:

1. **Eigenvalue criterion:** All eigenvalues $\lambda_i > 0$.
2. **Sylvester's criterion:** All leading principal minors $D_k = \det(A_{1:k, 1:k}) > 0$ for $k = 1, 2, \ldots, n$.
3. **Cholesky criterion:** $A = LL^T$ for some lower triangular $L$ with positive diagonal entries.

**Key Theorem (Sylvester):** A symmetric matrix $A$ is positive definite if and only if all $n$ leading principal minors are strictly positive. This is the computational workhorse in GATE.

A matrix is **positive semidefinite** if $\mathbf{x}^T A \mathbf{x} \geq 0$ for all $\mathbf{x}$ (allowing zero eigenvalues); **negative definite** if all eigenvalues are negative; **indefinite** if eigenvalues have mixed signs.

**Method selector.** Reach for Sylvester's criterion as the default test for size $n\ge3$ — it's determinant arithmetic, cheaper than an eigen-decomposition. The tempting-but-wrong alternative is checking only the diagonal entries' signs (or $\det(A)$ alone): both are *necessary*, never *sufficient*. $\begin{pmatrix}1&3\\3&1\end{pmatrix}$ has a positive diagonal and $\det=-8<0$ once you actually finish the check — eigenvalues $4,-2$, indefinite. Skipping straight to "diagonal looks fine" is exactly the shortcut that fails.
