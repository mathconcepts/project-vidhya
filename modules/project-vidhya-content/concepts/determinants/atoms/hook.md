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
{"v":1,"kind":"simulation","title":"det([[3,0],[0,2]]) = 6: the unit circle's area grows 6x","x_expr":"3*cos(t)","y_expr":"2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-3.2,"x_max":3.2,"y_min":-3.2,"y_max":3.2},"narration_steps":[{"at_progress":0.0,"text":"This is the unit circle after the matrix has acted on every one of its points. Watch the shape it draws, not the dot.","text_shaken":"Watch the traced curve, not the moving dot: it's what happens to every point of the unit circle at once.","text_assured":"This is $A$ applied to the unit circle — for a diagonal matrix the eigen-directions are just the axes, so a circle becomes an axis-aligned ellipse."},{"at_progress":0.25,"text":"At the top of the sweep it reaches $y=2$. The vertical direction was stretched by a factor of 2.","text_shaken":"The dot is at $(0,2)$ right now. The circle only ever reached $y=1$ before — this axis got 2 times longer.","text_assured":"The 2 in the matrix scales the $y$-axis alone; a diagonal matrix never mixes the axes into each other."},{"at_progress":0.5,"text":"Half way round, out at $x=-3$. The horizontal direction was stretched by 3.","text_shaken":"Now the dot is at $(-3,0)$. The circle used to stop at $x=-1$ — this axis got 3 times longer.","text_assured":"3 and 2 are the two eigenvalues here; for a diagonal matrix the determinant is their product, not their sum."},{"at_progress":0.8,"text":"Three across, two up: the area enclosed is exactly 6 times the circle's — that product of the two stretch factors is the determinant.","text_shaken":"3 times 2 is 6: the ellipse's area is 6 times the circle's, and 6 is exactly $\\det(A)$.","text_assured":"$\\det(A)=6$ because the factors multiply, not add — and scaling the whole matrix by a constant $c$ scales the determinant by $c^2$, not $c$.","emphasize":true,"trap":{"text":"Students who have just seen 'det = product of the axis stretches' assume scaling the whole matrix by a constant $c$ scales the determinant by $c$ too.","avoid":"Scale each axis separately: for an $n\\times n$ matrix, $\\det(cA)=c^n\\det(A)$ — here $n=2$, so a factor of $c$ becomes $c^2$."}}]}
```
