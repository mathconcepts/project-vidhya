---
id: orthogonality.hook
concept_id: orthogonality
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

Push a crate due north. How much of that push moved it east? None at all — and that is what orthogonal means, made operational. The test is a single multiplication: the dot product comes out zero. Build a whole basis that way and the messy simultaneous equations you would otherwise be solving collapse into a handful of independent dot products.

```interactive-spec
{"v":1,"kind":"simulation","title":"Two orthogonal frequencies: cos(t) against cos(2t)","x_expr":"cos(t)","y_expr":"cos(2*t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-1.3,"x_max":1.3,"y_min":-1.3,"y_max":1.3},"caption":"Watch the dot trace a looping curve instead of a circle — cos(t) and cos(2t) are orthogonal functions, the same zero-overlap idea as two perpendicular vectors."}
```
