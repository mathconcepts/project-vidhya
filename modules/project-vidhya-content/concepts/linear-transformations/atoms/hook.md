---
id: linear-transformations.hook
concept_id: linear-transformations
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

A linear transformation is a "fair" way to move vectors in space: it respects vector addition and scalar multiplication. Rotating an image, scaling it, or shearing it are linear transformations. Translating (moving without rotating) is not linear because it doesn't map zero to zero.

```interactive-spec
{"v":1,"kind":"simulation","title":"Matrix [[2,1],[0,1]] Turns a Circle into an Ellipse","x_expr":"2*cos(t) + sin(t)","y_expr":"sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-2.4,"x_max":2.4,"y_min":-1.3,"y_max":1.3},"caption":"Watch the dot trace a tilted ellipse instead of a circle — that stretch and tilt is exactly what multiplying every point by this matrix does to the plane."}
```
