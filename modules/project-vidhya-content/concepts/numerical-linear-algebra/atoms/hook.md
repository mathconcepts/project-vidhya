---
id: numerical-linear-algebra.hook
concept_id: numerical-linear-algebra
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

Solving $Ax = b$ for huge matrices (thousands of rows) is impractical with pencil-and-paper Gaussian elimination. Numerical linear algebra exploits sparsity, iterates cleverly, and uses matrix decompositions (like LU) to solve systems faster and more stably. The key insight: by decomposing $A = LU$ (lower × upper triangle), you trade one expensive factorization for many cheap forward-backward solves.
