---
id: spectral-theorem.formal-definition
concept_id: spectral-theorem
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**The Spectral Theorem for Symmetric Matrices.**

Let $A \in \mathbb{R}^{n \times n}$ be symmetric, meaning $A^{\mathrm{T}} = A$. Then:

1. $A$ has exactly $n$ real eigenvalues (counting algebraic multiplicity).
2. Eigenvectors corresponding to *distinct* eigenvalues are orthogonal.
3. There exist an orthogonal matrix $Q$ and a diagonal matrix $\Lambda$ such that:
$$A = Q\Lambda Q^{\mathrm{T}}$$
where the columns of $Q$ are orthonormal eigenvectors and $\Lambda = \mathrm{diag}(\lambda_1, \lambda_2, \ldots, \lambda_n)$ contains the eigenvalues.

**Key consequence — computing matrix functions.** For any scalar function $f$ and symmetric $A$:
$$f(A) = Q \, f(\Lambda) \, Q^{\mathrm{T}} = Q \, \mathrm{diag}\left(f(\lambda_1), f(\lambda_2), \ldots, f(\lambda_n)\right) Q^{\mathrm{T}}$$

This reduces computing $\sqrt{A}$, $A^{-1}$, $e^A$, or $\sin(A)$ to simple scalar operations on eigenvalues.

**Method selector.** Reach for $A=Q\Lambda Q^T$ whenever $A$ is symmetric and you need a function of $A$ — a power, $\sqrt{A}$, $e^A$ — since $Q^{-1}=Q^T$ is free, no inversion required. The tempting-but-wrong alternative is diagonalizing as a general $A=PDP^{-1}$ and computing $P^{-1}$ by cofactor expansion or Gaussian elimination: it lands on the same answer but spends real, avoidable work that symmetry was supposed to save you.
