---
# Alternative body for linear-transformations.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: linear-transformations.hook.shaken
concept_id: linear-transformations
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: linear-transformations.hook
for_stance: shaken
---

A transformation is "linear" when it plays fair with adding and scaling.

Rotating a picture is fair. Scaling it is fair. Sliding it three inches right is not — the zero vector $(0,0)$ has to land on $(0,0)$, and a slide moves it away.

```interactive-spec
{"v":1,"kind":"simulation","title":"Matrix [[2,1],[0,1]] turns a circle into an ellipse","x_expr":"2*cos(t) + sin(t)","y_expr":"sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-2.4,"x_max":2.4,"y_min":-1.3,"y_max":1.3},"caption":"Watch the dot trace a tilted ellipse instead of a circle — that stretch and tilt is exactly what multiplying every point by this matrix does to the plane.","narration_steps":[{"at_progress":0,"text":"Every point of the unit circle, pushed through [[2,1],[0,1]]. The dot starts where (1,0) landed: out at (2,0)."},{"at_progress":0.25,"text":"A quarter turn in, the point (0,1) has been carried to (1,1) — pushed sideways as well as up. That sideways push is the shear."},{"at_progress":0.55,"text":"The circle has become a tilted ellipse. Straight lines stayed straight and the centre never moved: that is what makes the map linear."},{"at_progress":0.85,"text":"The area doubled, because the determinant is 2. Sliding the whole plane could never produce this — a slide moves the origin, and linear maps cannot."}]}
```
