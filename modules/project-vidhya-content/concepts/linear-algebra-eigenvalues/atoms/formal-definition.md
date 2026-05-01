---
id: linear-algebra-eigenvalues.formal-definition
concept_id: linear-algebra-eigenvalues
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

For a square matrix $A$, a nonzero vector $v$ is an **eigenvector** with **eigenvalue** $\lambda$ if:

$$Av = \lambda v$$

Equivalently, $(A - \lambda I)v = 0$. For nonzero $v$ to satisfy this, $A - \lambda I$ must be singular:

$$\det(A - \lambda I) = 0$$

This **characteristic polynomial** in $\lambda$ has degree $n$ for an $n \times n$ matrix. Its roots are the eigenvalues. For each $\lambda$, solve $(A - \lambda I)v = 0$ to get the eigenvector(s).

A matrix is **diagonalizable** if it has $n$ linearly independent eigenvectors.
