---
id: quadratic-forms.visual_analogy
concept_id: quadratic-forms
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

Think of a quadratic form as a landscape. A positive definite form is a bowl-shaped valley: no matter which direction you walk from the center, the ground rises. An indefinite form is a mountain pass — a saddle: rising one way, falling another. Eigenvectors point along the ridges of this landscape; eigenvalues tell you how steep each ridge is.

In 2D, the level curves $\mathbf{x}^TA\mathbf{x}=c$ are ellipses (positive definite), hyperbolas (indefinite), or degenerate lines (semidefinite).

```gif-scene
{"type":"level-set","expression":"x**2 + 4*y**2","x_range":[-3,3],"y_range":[-3,3],"frames":30,"fps":12}
```
