---
id: symmetric-matrices.formal_definition
concept_id: symmetric-matrices
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Definition:** A square matrix $A \in \mathbb{R}^{n \times n}$ is **symmetric** if $A = A^T$, i.e., $a_{ij} = a_{ji}$ for all $i, j$.

**Spectral Theorem (Key Result):** If $A$ is a real symmetric matrix, then:

1. All eigenvalues of $A$ are real.
2. Eigenvectors corresponding to distinct eigenvalues are orthogonal.
3. There exists an orthonormal basis of eigenvectors; equivalently, $A = Q\Lambda Q^T$ where $Q$ is an orthogonal matrix and $\Lambda$ is diagonal.

**Consequence:** Symmetric matrices are precisely those that can be diagonalized by an orthogonal transformation, making them fundamental in both theory and computation.