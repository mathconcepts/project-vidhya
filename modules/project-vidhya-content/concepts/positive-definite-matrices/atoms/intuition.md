---
id: positive-definite-matrices.intuition
concept_id: positive-definite-matrices
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

Imagine a quadratic bowl. A positive definite matrix ensures the quadratic form $\mathbf{x}^T A \mathbf{x}$ defines an actual bowl shape—it curves upward in every direction. Geometrically, all eigenvalues are positive, so no eigendirection is "neutral" or "inverted." For optimization, this guarantees a unique global minimum. Cholesky factorization $A = LL^T$ always succeeds without pivoting, making it numerically stable. Think of it as "all-in" positivity: not a single eigenvalue or principal minor can go non-positive.