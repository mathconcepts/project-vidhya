---
id: spectral-theorem.formal-definition
concept_id: spectral-theorem
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**The Spectral Theorem for Symmetric Matrices:**

Let $A \in \mathbb{R}^{n \times n}$ be symmetric, meaning $A^{\mathrm{T}} = A$. Then:

1. $A$ has exactly $n$ real eigenvalues (counting algebraic multiplicity).
2. Eigenvectors corresponding to *distinct* eigenvalues are orthogonal.
3. There exist an orthogonal matrix $Q$ and a diagonal matrix $\Lambda$ such that:
$$A = Q\Lambda Q^{\mathrm{T}}$$
where the columns of $Q$ are orthonormal eigenvectors and $\Lambda = \mathrm{diag}(\lambda_1, \lambda_2, \ldots, \lambda_n)$ contains the eigenvalues.

**Key Consequence — Computing Matrix Functions:**

For any scalar function $f$ and symmetric $A$:
$$f(A) = Q \, f(\Lambda) \, Q^{\mathrm{T}} = Q \, \mathrm{diag}\left(f(\lambda_1), f(\lambda_2), \ldots, f(\lambda_n)\right) Q^{\mathrm{T}}$$

This reduces the hard problem of computing $\sqrt{A}$, $A^{-1}$, $e^A$, or $\sin(A)$ to simple scalar operations on eigenvalues.