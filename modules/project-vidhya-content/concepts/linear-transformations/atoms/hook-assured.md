---
# Alternative body for linear-transformations.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: linear-transformations.hook.assured
concept_id: linear-transformations
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: linear-transformations.hook
for_stance: assured
---

Linearity is closure under $+$ and scalar $\cdot$, and it's the single fact that lets you replace "what does $T$ do to every vector" with "what does $T$ do to a basis" — every $T(\vec v)$ is then a linear combination of $T$'s action on those few vectors, which is exactly why $T$ collapses to a matrix.

The failure mode worth knowing cold: translation. $T(0)\neq 0$ is the fastest disqualifier on any "is this linear?" question, and it catches most non-examples in one check.

```interactive-spec
{"v":1,"kind":"simulation","title":"Matrix [[2,1],[0,1]] turns a circle into an ellipse","x_expr":"2*cos(t) + sin(t)","y_expr":"sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-2.4,"x_max":2.4,"y_min":-1.3,"y_max":1.3},"caption":"Watch the dot trace a tilted ellipse instead of a circle — that stretch and tilt is exactly what multiplying every point by this matrix does to the plane."}
```
