---
id: determinants.hook
concept_id: determinants
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

Apply a matrix to the unit square and watch what becomes of its area. Tripled? That factor is the determinant. Turned inside out? The determinant is negative. Squashed flat onto a line, area zero? Determinant zero — which is the very same statement as "not invertible". One number, and it decides all of that.

```interactive-spec
{"v":1,"kind":"simulation","title":"det([[3,0],[0,2]]) = 6: the unit circle's area grows 6x","x_expr":"3*cos(t)","y_expr":"2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-3.2,"x_max":3.2,"y_min":-3.2,"y_max":3.2},"caption":"Watch the traced curve — it's the unit circle stretched by A, enclosing exactly 6x the original area, matching det(A) = 6.","narration_steps":[{"at_progress":0,"text":"This is the unit circle after the matrix has acted on every one of its points. Watch the shape it draws, not the dot."},{"at_progress":0.25,"text":"At the top of the sweep it reaches y = 2. The vertical direction was stretched by a factor of 2."},{"at_progress":0.5,"text":"Half way round, out at x = -3. The horizontal direction was stretched by 3."},{"at_progress":0.8,"text":"Three across, two up: the area enclosed is exactly 6 times the circle's. That number is the determinant."}]}
```
