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
{"v":1,"kind":"simulation","title":"Matrix [[2,1],[0,1]] turns a circle into an ellipse","x_expr":"2*cos(t) + sin(t)","y_expr":"sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-2.4,"x_max":2.4,"y_min":-1.6,"y_max":1.6},"narration_steps":[{"at_progress":0.0,"text":"Every point of the unit circle, pushed through $[[2,1],[0,1]]$. The dot starts where $(1,0)$ landed: out at $(2,0)$.","text_shaken":"The dot starts at $(2,0)$ — that's where $(1,0)$ landed after the matrix acted on it.","text_assured":"Column 1 of the matrix, $(2,0)$, is exactly where the matrix sends $(1,0)$ — that's what a matrix's first column always is."},{"at_progress":0.25,"text":"A quarter turn in, the point $(0,1)$ has been carried to $(1,1)$ — pushed sideways as well as up. That sideways push is the shear.","text_shaken":"Now the dot is at $(1,1)$ — that's where $(0,1)$ landed. It moved sideways, not just up.","text_assured":"Column 2 of the matrix, $(1,1)$, is where $(0,1)$ lands — read the columns directly, don't recompute $T$ from scratch on every vector."},{"at_progress":0.55,"text":"The circle has become a tilted ellipse. Straight lines stayed straight and the centre never moved: that is what makes the map linear.","text_shaken":"The shape is now a tilted ellipse. The centre is still at $(0,0)$ — it never moved.","text_assured":"The centre staying at the origin isn't cosmetic — $T(\\mathbf0)=\\mathbf0$ is required of every linear map, no exceptions.","emphasize":true,"trap":{"text":"Students call a translation (sliding the whole picture over) linear because it also looks like a simple, single-step map.","avoid":"Check $T(\\mathbf0)=\\mathbf0$ first — a translation always moves the origin, so it can never be linear, no matter how simple it looks."}},{"at_progress":0.85,"text":"The area doubled, because the determinant is 2. Sliding the whole plane could never produce this — a slide moves the origin, and linear maps cannot.","text_shaken":"The area is now double the circle's, because $\\det=2$. A slide (dashed grey circle) would have kept the same area and missed the origin.","text_assured":"A translation, dashed grey, keeps the circle's shape and area unchanged but drags the centre off the origin — the opposite failure from what linear maps allow."}],"ghost":{"x_expr":"cos(t)+1","y_expr":"sin(t)+0.5"}}
```
