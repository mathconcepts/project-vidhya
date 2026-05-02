---
id: linear-algebra-eigenvalues.visual_analogy
concept_id: linear-algebra-eigenvalues
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

An eigenvector is a direction the matrix only stretches — never rotates. The eigenvalue $\lambda$ is how much it stretches by. Watch $y = 2x$ trace itself: that line is the eigenspace, and $\lambda = 2$ scales every vector along it by a factor of two.

If you applied the matrix repeatedly, points along this line slide outward (or inward, for $|\lambda| < 1$), but they never leave the line. Off-axis points wobble around it. The eigenvector is the still axis of an otherwise twisting transformation.

```gif-scene
{"type":"function-trace","expression":"2*x","x_range":[-2,2],"y_range":[-4,4],"frames":30,"fps":12}
```
