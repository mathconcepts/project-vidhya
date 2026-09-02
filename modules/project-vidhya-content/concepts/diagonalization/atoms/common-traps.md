---
id: diagonalization.common-traps
concept_id: diagonalization
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing necessary and sufficient conditions.** A matrix is diagonalizable — meaning you can rewrite it as $P D P^{-1}$ with $D$ a simple diagonal matrix — only when, for EVERY eigenvalue, the geometric multiplicity equals the algebraic multiplicity. Algebraic multiplicity is how many times an eigenvalue repeats as a root of the characteristic polynomial; geometric multiplicity is how many independent eigenvectors it actually has. These two numbers have to match for each and every eigenvalue, not just the one you happened to check — that's why students who verify only one eigenvalue and call it done get caught out.
- **Thinking all matrices are diagonalizable.** Not every matrix can be rewritten this way. A matrix in Jordan normal form — think of an upper-triangular matrix with a repeated number sitting on the diagonal — is a classic example that usually isn't diagonalizable. A matrix is only diagonalizable when its eigenvectors span the full space, meaning you can find enough independent ones to cover every direction.
- **Forgetting that $P$ must be invertible.** The columns of $P$ have to be linearly independent eigenvectors — vectors where none can be built from a combination of the others. If they're dependent instead, $P$ turns out singular (its determinant is zero), and a singular matrix has no inverse $P^{-1}$ at all.
