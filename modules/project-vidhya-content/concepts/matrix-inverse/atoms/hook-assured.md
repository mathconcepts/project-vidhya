---
# Alternative body for matrix-inverse.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: matrix-inverse.hook.assured
concept_id: matrix-inverse
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: matrix-inverse.hook
for_stance: assured
---

$A^{-1}$ undoes $A$: $AA^{-1} = A^{-1}A = I$. Exists iff $\det(A) \neq 0$ — a zero determinant means $A$ collapses space onto a lower dimension, and nothing can un-collapse it. $(AB)^{-1} = B^{-1}A^{-1}$: order reverses, same pattern as transpose.

```interactive-spec
{"v":1,"kind":"simulation","title":"Invertible vs singular: one matrix keeps the plane spread, the ghost crushes it flat","duration_sec":9,"linear_map":{"matrix":[[3,1],[1,1]],"num_vectors":16,"ghost_matrix":[[2,1],[4,2]]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows are about to be pushed through $\\begin{pmatrix}3&1\\\\1&1\\end{pmatrix}$ — determinant 2. Watch whether the arrows stay spread out across the whole plane, or get crushed onto one line.","text_shaken":"Sixteen arrows sit around a circle. They're about to be pushed through a matrix. Watch whether they stay spread apart or collapse onto a single line.","text_assured":"Determinant 2 means the map is invertible before a single arrow moves — the real test is whether the ghost matrix, determinant 0, manages the same.","emphasize":false},{"at_progress":0.22,"text":"Push! Every arrow tilts and stretches — but none of them collapse onto each other. The plane is still fully spread out, just reshaped.","text_shaken":"Every arrow moves to a new spot, tilted and longer or shorter. But no two arrows land on top of each other.","text_assured":"Full rank 2: the sixteen directions stay sixteen distinct directions after the push, none merging onto a shared line.","emphasize":false},{"at_progress":0.55,"text":"The circle has become a tilted ellipse — squashed, but still a genuine 2-dimensional shape. Nothing here is unrecoverable: you could push it right back with $A^{-1}$.","text_shaken":"The circle is now a tilted ellipse, not a flat line. It still covers area — nothing was thrown away, so it can still be undone.","text_assured":"Ellipse, not a segment: $\\det=2\\neq0$ guarantees the image stays 2-dimensional, exactly the condition $A^{-1}$ needs to exist.","emphasize":true},{"at_progress":0.8,"text":"Compare that to the dashed grey arrows: the matrix $\\begin{pmatrix}2&1\\\\4&2\\end{pmatrix}$, determinant 0, crushes every one of them onto a single line. Once flattened, there is no way back — this arrow is invertible; the ghost is not.","text_shaken":"The dashed grey arrows show a different matrix, determinant 0. All sixteen collapse onto one line. Once that happens, nothing can spread them back out.","text_assured":"$\\det\\begin{pmatrix}2&1\\\\4&2\\end{pmatrix}=0$ — row 2 is $2\\times$ row 1, rank 1, image is a line. That information loss is exactly why no inverse exists.","emphasize":false,"trap":{"text":"Students try to compute the inverse of a matrix like the dashed ghost before checking whether its determinant is zero.","avoid":"Check $\\det(A)$ first, always. Here $\\det\\begin{pmatrix}3&1\\\\1&1\\end{pmatrix}=2\\neq0$, so $A^{-1}$ exists; the ghost's determinant is 0, so it never does."}}]}
```
