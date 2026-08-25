---
id: positive-definite-matrices.visual-analogy
concept_id: positive-definite-matrices
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

Positive definite matrices are to quadratic forms what a convex lens is to light—they focus energy everywhere. A negative definite matrix flips the bowl upside-down (all eigenvalues negative), while a positive semidefinite matrix allows a flat direction (like a gutter that curves elsewhere). If you plot $z = \mathbf{x}^T A \mathbf{x}$ for a $2 \times 2$ positive definite $A$, you see an elliptical paraboloid opening upward. Rotate to principal axes (eigenvector basis) and it becomes $z = \lambda_1 x_1^2 + \lambda_2 x_2^2$ with both $\lambda_i > 0$—a pure, unambiguous upward curve.

```gif-scene
{"type":"level-set","expression":"x**2 + 4*y**2","x_range":[-2,2],"y_range":[-2,2],"frames":30,"fps":12}
```