---
id: eigenvalues.formal-definition
concept_id: eigenvalues
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

**Method selector.** Solve the full characteristic equation $\det(A-\lambda I)=0$ whenever the question wants the *individual* eigenvalues — not the trace/determinant shortcut alone. Trace and determinant hand you $\sum\lambda_i$ and $\prod\lambda_i$, which pin down two eigenvalues for a $2\times2$ but under-determine three or more; reaching for that shortcut on an $n\ge3$ matrix when individual values are asked for is the fast way to submit a sum where a list was wanted.
