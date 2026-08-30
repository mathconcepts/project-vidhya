---
# Alternative body for matrix-operations.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: matrix-operations.hook.assured
concept_id: matrix-operations
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: matrix-operations.hook
for_stance: assured
---

Matrix multiplication composes transformations: $(AB)_{ij}$ is row $i$ of $A$ dotted with column $j$ of $B$. Associative, not commutative — $AB \neq BA$ in general, because "rotate then scale" isn't "scale then rotate." Addition and transpose are the easy operations; multiplication is where the structure — and the marks — live.

```interactive-spec
{"v":1,"kind":"simulation","title":"Rotate-then-shear vs shear-then-rotate: BA is not AB","x_expr":"cos(t)-sin(t)","y_expr":"cos(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-1.8,"x_max":1.8,"y_min":-1.8,"y_max":1.8},"narration_steps":[{"at_progress":0.0,"text":"This is the unit circle after the matrix product **BA** acts on it — rotate first, then shear. The dot starts at $(1,1)$.","text_shaken":"Start at the point $(1,1)$. That's where $(1,0)$ lands after a 90° rotation and then a shear — two steps, one matrix.","text_assured":"$BA$ means apply $A$ first, then $B$ — right-to-left order. The dot's start, $(1,1)$, already reflects both steps."},{"at_progress":0.25,"text":"A quarter turn in, the dot is at $(-1,0)$ — the trace is already not a plain rotated circle; the shear has bent it.","text_shaken":"Now the dot sits at $(-1,0)$, not on a pure rotated circle. The shear has already pulled it off that path.","text_assured":"The trace isn't a circle: a shear alone breaks the symmetry a pure rotation would keep."},{"at_progress":0.5,"text":"Half way round, the dot is at $(-1,-1)$ — multiply the same two matrices in the other order and you land at $(0,-1)$ instead, the dashed grey dot.","text_shaken":"Here the real path gives $(-1,-1)$. The dashed path — same two matrices, opposite order — gives $(0,-1)$. Different points.","text_assured":"This is the order-sensitivity behind $(AB)^T=B^TA^T$: reversing the product isn't a relabeling, it changes the map.","emphasize":true,"trap":{"text":"Students read $AB$ and $BA$ as the same matrix because both use $A$ and $B$.","avoid":"Multiply in the exact order written — the dashed path shows the different result the reversed order gives."}},{"at_progress":0.9,"text":"The loop is nearly closed: one matrix product traced a tilted ellipse, area still $\\pi$ because $\\det(BA)=1$ — rotation and shear each preserve area, and so does their product.","text_shaken":"The traced shape is an ellipse with the same area as the circle it started from, $\\pi$ — one matrix multiply gets you here in one step.","text_assured":"Area held at $\\pi$ because $\\det(A)=\\det(B)=1$; that survives multiplication precisely because determinants multiply: $\\det(BA)=\\det(B)\\det(A)$."}],"ghost":{"x_expr":"-sin(t)","y_expr":"cos(t)+sin(t)"}}
```
