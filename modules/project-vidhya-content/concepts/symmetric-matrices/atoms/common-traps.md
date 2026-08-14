---
id: symmetric-matrices.common_traps
concept_id: symmetric-matrices
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Confusing symmetric with Hermitian**

A real symmetric matrix ($A = A^T$) is a special case of a Hermitian matrix ($A = A^*$). In GATE, always check whether you're working with real or complex matrices. For real matrices, symmetric is equivalent to Hermitian, but the converse is not true for complex matrices. A matrix with complex entries can be Hermitian without being symmetric.

**Trap 2: Assuming complex eigenvalues are possible**

A common error: you compute the characteristic polynomial, the discriminant looks negative, and you conclude there are complex eigenvalues. Stop—for a symmetric matrix, all eigenvalues **must be real**. If your arithmetic gives a negative discriminant, you have made a computational error. Go back and check your characteristic equation.

**Trap 3: Forgetting that orthogonality is automatic**

Students sometimes laboriously compute dot products to verify that eigenvectors are orthogonal. But the spectral theorem guarantees: if $A$ is symmetric and $\lambda_i \neq \lambda_j$, then eigenvectors $\mathbf{v}_i$ and $\mathbf{v}_j$ are automatically orthogonal. On a timed GATE exam, use this fact to avoid unnecessary computation.

**Trap 4: Misapplying the spectral decomposition formula**

The formula $A = Q\Lambda Q^T$ (with $Q$ orthogonal) is valid **only for symmetric matrices**. If you try to apply it to a non-symmetric matrix, you will get nonsense. The critical point: for symmetric $A$, the diagonalizing matrix $Q$ satisfies $Q^{-1} = Q^T$ (it is orthogonal). This property does not hold for general matrices.

**Trap 5: Neglecting to normalize eigenvectors**

The spectral theorem states that $A$ has an **orthonormal basis** of eigenvectors. If you find eigenvectors but forget to normalize them (divide by their length), your matrix $Q$ will not be orthogonal, and the formula $A = Q\Lambda Q^T$ will fail.