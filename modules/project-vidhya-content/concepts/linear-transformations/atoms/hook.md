---
id: linear-transformations.hook
concept_id: linear-transformations
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

Rotate a picture: fair. Scale it: fair. Slide it three inches to the right: not fair — and the reason is a single point. The origin has to land on the origin, and a slide carries it away. That one requirement, together with playing nicely with addition and scaling, is what separates the transformations a matrix can represent from the ones it cannot.

```interactive-spec
{"v":1,"kind":"simulation","title":"Matrix [[2,1],[0,1]] turns a circle into an ellipse","x_expr":"2*cos(t) + sin(t)","y_expr":"sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-2.4,"x_max":2.4,"y_min":-1.3,"y_max":1.3},"caption":"Watch the dot trace a tilted ellipse instead of a circle — that stretch and tilt is exactly what multiplying every point by this matrix does to the plane."}
```
