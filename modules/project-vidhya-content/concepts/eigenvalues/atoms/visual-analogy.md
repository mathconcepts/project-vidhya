---
id: eigenvalues.visual_analogy
concept_id: eigenvalues
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

An eigenvector is a direction the matrix only stretches — never rotates. Same matrix as the hook, $A=\begin{pmatrix}2&1\\1&2\end{pmatrix}$: its eigenline is $y=x$, the line traced on this card, and $\lambda=3$ scales every vector along it by a factor of three.

If you applied the matrix repeatedly, points along this line march outward (or inward, for $|\lambda|<1$), but they never leave the line. Off-axis points wobble around it instead. The eigenvector is the still axis of an otherwise twisting transformation.

```gif-scene
{"type":"function-trace","expression":"x","x_range":[-2,2],"y_range":[-3,3],"frames":30,"fps":12}
```
