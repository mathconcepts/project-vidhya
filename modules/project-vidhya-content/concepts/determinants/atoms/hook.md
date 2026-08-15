---
id: determinants.hook
concept_id: determinants
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

The determinant is a single number that tells you whether a transformation "stretches" (positive det), "flips" (negative det), or "crushes" the space to zero (det = 0). It's the factor by which the transformation scales volumes.

```interactive-spec
{"v":1,"kind":"simulation","title":"det([[3,0],[0,2]]) = 6: the unit circle's area grows 6x","x_expr":"3*cos(t)","y_expr":"2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-3.2,"x_max":3.2,"y_min":-3.2,"y_max":3.2},"caption":"Watch the traced curve — it's the unit circle stretched by A, enclosing exactly 6x the original area, matching det(A) = 6."}
```
