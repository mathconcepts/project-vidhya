---
id: diagonalization.common-traps
concept_id: diagonalization
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing necessary and sufficient conditions**: A matrix is diagonalizable iff geometric multiplicity = algebraic multiplicity for EACH eigenvalue, not just one. Students often check only one eigenvalue.
- **Thinking all matrices are diagonalizable**: Jordan normal form matrices (like upper triangular with repeated diagonal entries) are not diagonalizable. Only if eigenvectors span the full space.
- **Forgetting that $P$ must be invertible**: The columns of $P$ must be linearly independent eigenvectors. If they're dependent, $P$ is singular and $P^{-1}$ doesn't exist.
