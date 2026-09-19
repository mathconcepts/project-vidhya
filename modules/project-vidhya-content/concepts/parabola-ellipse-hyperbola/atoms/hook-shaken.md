---
id: parabola-ellipse-hyperbola.hook-shaken
concept_id: parabola-ellipse-hyperbola
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: parabola-ellipse-hyperbola.hook
for_stance: shaken
---

Fix a point $F$ (the focus) and a line (the directrix). For any point $P$ on the curve: divide (distance from $P$ to $F$) by (distance from $P$ to the line).

That one ratio is called eccentricity, $e$. If $e=1$: parabola. If $e<1$: ellipse. If $e>1$: hyperbola.

Below, watch the parabola case, $e=1$: the two distances stay equal the whole way along the curve.

```interactive-spec
{"v":1,"kind":"simulation","title":"Every point on this curve is exactly as far from F(1,0) as it is from the line x=−1","why":"A parabola is exactly the set of points equally far from a focus and a directrix line — the same fixed-ratio idea (eccentricity) that turns this same construction into an ellipse (e<1) or a hyperbola (e>1).","x_expr":"t^2","y_expr":"2*t","t_min":0,"t_max":2,"duration_sec":7,"reference_points":[{"id":"focus","label":"F(1,0)","x":1,"y":0},{"id":"directrix_pt","label":"on x=-1","x":-1,"y":0}],"view_box":{"x_min":-2.5,"x_max":5,"y_min":-1.5,"y_max":5},"narration_steps":[{"at_progress":0,"text":"This traces the parabola y²=8x through P=(t²,2t) as t runs from 0 to 2. F(1,0) is the focus; the vertical line through (−1,0) marks the directrix, x=−1. At t=0, P sits at the vertex (0,0).","focus_point":true},{"at_progress":0.3,"text":"At P=(0.36,1.2): the distance to the focus works out to PF=√(0.4096+1.44)=1.36. Before checking: will the straight-across distance from P to the line x=−1 be smaller, larger, or exactly 1.36 too?","focus_point":true},{"at_progress":0.5,"text":"At P=(1,2): PF=√(0+4)=2, and the distance to x=−1 is 1−(−1)=2. Exactly equal — and it is not a coincidence. For every point (t²,2t) on this curve, both distances come out to t²+1.","emphasize":true,"focus_point":true},{"at_progress":0.75,"text":"Does that equality survive further out along the curve, or was it special to the points checked so far?","trap":{"text":"Students often measure to the axis, or along a slanted line toward where the axis meets the directrix, instead of straight across (perpendicular) to the vertical line x=−1.","avoid":"The distance to a vertical directrix is always horizontal — just x−(−1)=x+1, measured parallel to the x-axis, never along a diagonal."}},{"at_progress":1.0,"text":"Even out at P=(4,4): PF=√(9+16)=5, and distance to x=−1 is 4+1=5 — equal again. A parabola is exactly where these two distances match. Shrink that ratio below 1 for an ellipse; push it above 1 for a hyperbola.","emphasize":true,"focus_point":true}]}
```
