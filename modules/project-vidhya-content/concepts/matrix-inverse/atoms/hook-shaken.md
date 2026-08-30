---
# Alternative body for matrix-inverse.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: matrix-inverse.hook.shaken
concept_id: matrix-inverse
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: matrix-inverse.hook
for_stance: shaken
---

A matrix has an inverse when $\det \neq 0$. Multiply a matrix by its inverse and you get back the identity — the "do nothing" matrix. Not every matrix has one.

```interactive-spec
{"v":1,"kind":"simulation","title":"A singular matrix collapses the circle onto a line: det = 0","x_expr":"cos(t)+2*sin(t)","y_expr":"2*cos(t)+4*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-2.5,"x_max":2.5,"y_min":-4.8,"y_max":4.8},"narration_steps":[{"at_progress":0.0,"text":"Every point of the unit circle, pushed through this matrix — the dot starts at $(1,2)$.","text_shaken":"The dot starts at $(1,2)$. Just watch where it goes as the circle sweeps around.","text_assured":"This matrix has second row exactly twice the first — a strong hint before you even reach for the determinant."},{"at_progress":0.25,"text":"A quarter turn in, and the dot is at $(2,4)$ — still a multiple of $(1,2)$, on the exact same line.","text_shaken":"Now the dot is at $(2,4)$. Check it: 4 is twice 2, same ratio as $(1,2)$.","text_assured":"Both images sit on $y=2x$ because row 2 of the matrix is $2\\times$ row 1 — the map has rank 1, not 2."},{"at_progress":0.5,"text":"Half way round, still on that line, now at $(-1,-2)$ — a full circle of input points is collapsing onto one line of output points.","text_shaken":"Still on the line: $(-1,-2)$. Every single point of the circle, forced onto this one line.","text_assured":"Rank 1 out of a possible 2 means the image is 1-dimensional — the kernel is exactly the direction perpendicular to $(1,2)$.","emphasize":true,"trap":{"text":"Students try to compute the inverse of a matrix like this one before checking whether $\\det(A)=0$.","avoid":"Check $\\det(A)$ first — here row 2 is $2\\times$ row 1, so $\\det(A)=0$ and no inverse exists, full stop."}},{"at_progress":0.85,"text":"No matter where the dot is on the circle, it never leaves the line $y=2x$ — a whole circle collapsed onto one line, and that collapse is exactly why $A^{-1}$ does not exist.","text_shaken":"The whole circle only ever produces points on one line. Nothing off that line is ever reached — that's what a zero determinant means.","text_assured":"This is the general picture behind $\\det(A)=0$: the image drops a dimension, so the map can't be undone — no way back to a full circle from a line."}]}
```
