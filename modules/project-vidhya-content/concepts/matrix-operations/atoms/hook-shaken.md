---
# Alternative body for matrix-operations.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: matrix-operations.hook.shaken
concept_id: matrix-operations
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: matrix-operations.hook
for_stance: shaken
---

Multiply matrix $A$ by matrix $B$: that's $AB$. Multiply $B$ by $A$ instead: that's $BA$. These are usually two different matrices.

Push sixteen arrows through $AB$. They land somewhere.

Now push those same arrows through $BA$ — the dashed grey arrows. Different landing spots. Same two matrices, opposite order, different answer.

```interactive-spec
{"v":1,"kind":"simulation","why":"This isn't just one example — it shows what $AB$ does to EVERY point in the plane at once, so \"matrix multiplication\" stops being a rule about rows and columns and becomes a picture of an action.","title":"Sixteen arrows meet AB=[[2,1],[1,1]] — the dashed ghosts show BA","duration_sec":9,"linear_map":{"matrix":[[2,1],[1,1]],"num_vectors":16,"ghost_matrix":[[1,1],[1,2]]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows are about to be pushed through $AB=\\begin{pmatrix}2&1\\\\1&1\\end{pmatrix}$ — the product of two shears, $A$ and $B$, applied in that order: $B$ first, then $A$.","text_shaken":"Sixteen arrows sit around a circle. They're about to move through one matrix: $AB$, built from two simpler shears multiplied together.","text_assured":"$AB$ means apply $B$ first, then $A$ — right-to-left. Watch whether the landing spots match if that order gets swapped.","emphasize":false},{"at_progress":0.22,"text":"Push! Every arrow swings and stretches — two shears composed into one matrix move everything at once, in a single step.","text_shaken":"Every one of the sixteen arrows tilts and grows. One matrix, two shears' worth of movement, all at once.","text_assured":"$AB$'s columns are $A$ applied to $B$'s columns — read them straight off rather than re-deriving the product on each vector.","emphasize":false},{"at_progress":0.55,"text":"The circle has become a tilted ellipse — because $AB$ stretches some directions more than others, a circle (same width everywhere) turns into an ellipse (wider one way than the other), tilted since the widest direction isn't the x or y axis. Watch for the dashed grey arrows next.","text_shaken":"The circle is now a tilted ellipse — $AB$ doesn't stretch every direction the same amount, so a circle (same width everywhere) gets pulled into an ellipse (longer one way), tilted since that long way isn't flat. Keep watching for the dashed grey arrows next.","text_assured":"Area held at $\\det(AB)=1$, since $\\det A=\\det B=1$ and determinants multiply — the shape distorts, but never grows or shrinks in area.","emphasize":true},{"at_progress":0.8,"text":"Multiply the same two matrices in the other order, $BA$, and you land somewhere else — the dashed grey arrows. Same two matrices, opposite order, different arrows.","text_shaken":"The dashed grey arrows show $BA$ — same two matrices, swapped order. They land in different spots than the solid arrows. Order matters.","text_assured":"$(AB)^T=B^TA^T$ is the algebraic fingerprint of this: reversing a product isn't relabeling, it's a genuinely different map — never assume $AB=BA$.","emphasize":false,"trap":{"text":"Students read $AB$ and $BA$ as the same matrix because both use the same two matrices $A$ and $B$.","avoid":"Multiply in the exact order written. The dashed ghost arrows show where $BA$ actually lands — a different set of points from $AB$'s solid arrows."}}]}
```
