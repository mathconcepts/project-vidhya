---
id: least-squares.visual_analogy
concept_id: least-squares
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

Think of fitting a best-fit line through scattered data points. You're looking for a line $y = mx + c$ such that the total vertical distance from each point to the line is minimized (in the sense of squared distance). The normal equations emerge naturally: you want the "slope" and "intercept" such that no change in either direction reduces the error further. In vector terms, the error vector is perpendicular to the column space—it cannot be "reduced" by any linear combination of your unknowns.

```gif-scene
{"type":"function-trace","expression":"0.5*x + 1","x_range":[-2,4],"y_range":[-1,3],"frames":30,"fps":12}
```