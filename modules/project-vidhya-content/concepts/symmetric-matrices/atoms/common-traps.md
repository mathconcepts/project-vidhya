---
id: symmetric-matrices.common_traps
concept_id: symmetric-matrices
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Confusing symmetric with Hermitian**

A real symmetric matrix ($A = A^T$, meaning it looks the same after you flip it across its main diagonal) is a special case of a Hermitian matrix — like a symmetric matrix, but built for complex-number entries, using the conjugate transpose $A^*$ (flip across the diagonal, then also flip the sign of every imaginary part) instead of the plain transpose $A^T$. In GATE, always check first whether you're working with real or complex matrices — that's why this distinction matters. For real matrices, symmetric and Hermitian mean the same thing, but the converse doesn't hold for complex matrices: a matrix with complex entries can be Hermitian without being symmetric.

**Trap 2: Assuming complex eigenvalues are possible**

A common slip: you compute the characteristic polynomial (the equation whose roots give the eigenvalues), the discriminant — the part under the square root that decides whether the roots are real or complex — comes out negative, and you conclude the eigenvalues must be complex. Stop right there. For a symmetric matrix, every eigenvalue is guaranteed to be real, no exceptions. A negative discriminant here means you've made an arithmetic slip — go back and recheck your characteristic equation, not your conclusion about complex numbers.

**Trap 3: Forgetting that orthogonality is automatic**

Some students painstakingly compute dot products (multiplying corresponding entries and adding them up) just to check that eigenvectors are orthogonal — meaning at right angles, with dot product zero. But the spectral theorem already guarantees this for free: if $A$ is symmetric and two eigenvalues $\lambda_i \neq \lambda_j$ differ, their eigenvectors $\mathbf{v}_i$ and $\mathbf{v}_j$ are automatically orthogonal. On a timed GATE exam, lean on this fact instead of grinding through dot products you don't need.

**Trap 4: Misapplying the spectral decomposition formula**

The formula $A = Q\Lambda Q^T$ — where $Q$ is an orthogonal matrix, meaning its columns are unit-length and mutually perpendicular, so $Q^{-1} = Q^T$ — is valid **only for symmetric matrices**. Try it on a non-symmetric matrix and you'll get nonsense, because a general matrix's eigenvector matrix doesn't have that same neat $Q^{-1} = Q^T$ shortcut.

**Trap 5: Neglecting to normalize eigenvectors**

The spectral theorem states that $A$ has an **orthonormal basis** of eigenvectors — a full set of eigenvectors that are both mutually perpendicular and scaled to unit length. If you find the right eigenvector directions but forget to normalize them (divide each by its own length), your matrix $Q$ won't actually be orthogonal, and the formula $A = Q\Lambda Q^T$ will fail — even though your eigenvectors were pointing the right way.