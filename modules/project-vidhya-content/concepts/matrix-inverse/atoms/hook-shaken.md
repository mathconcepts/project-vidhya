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

A matrix has an inverse when $\det \neq 0$. Push sixteen arrows through the solid matrix: they stay spread out, just tilted and stretched.

The dashed grey arrows show a different matrix — $\det=0$. All sixteen of those collapse onto one line.

Once collapsed, nothing spreads them back out. That is what "no inverse" looks like.

```interactive-spec
{"v":1,"kind":"simulation","title":"Invertible vs singular: one matrix keeps the plane spread, the ghost crushes it flat","duration_sec":9,"linear_map":{"matrix":[[3,1],[1,1]],"num_vectors":16,"ghost_matrix":[[2,1],[4,2]]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows are about to be pushed through $\\begin{pmatrix}3&1\\\\1&1\\end{pmatrix}$ — determinant 2. Watch whether the arrows stay spread out across the whole plane, or get crushed onto one line.","text_shaken":"Sixteen arrows sit around a circle. They're about to be pushed through a matrix. Watch whether they stay spread apart or collapse onto a single line.","text_assured":"Determinant 2 means the map is invertible before a single arrow moves — the real test is whether the ghost matrix, determinant 0, manages the same.","emphasize":false},{"at_progress":0.22,"text":"Push! Every arrow tilts and stretches — but none of them collapse onto each other. The plane is still fully spread out, just reshaped.","text_shaken":"Every arrow moves to a new spot, tilted and longer or shorter. But no two arrows land on top of each other.","text_assured":"Full rank 2: the sixteen directions stay sixteen distinct directions after the push, none merging onto a shared line.","emphasize":false},{"at_progress":0.45,"text":"The circle has become a tilted ellipse — squashed, but still covering area, not flattened onto a single line. Question: can this squashing be undone and pushed back to the original circle, or is something lost for good?","text_shaken":"The circle is now a tilted ellipse — squashed, but still covering area, not a flat line. Can this be undone and pushed back, or is something lost for good?","text_assured":"The image is an ellipse, not a segment — full area retained. Does that alone guarantee the map can be undone, or could information still be lost?","emphasize":false},{"at_progress":0.6,"text":"Nothing is lost — this can be undone. An ellipse is still a genuine 2-dimensional shape, so you could push it right back with $A^{-1}$.","text_shaken":"Nothing was thrown away, so it can still be undone. The ellipse still covers area — that's what makes $A^{-1}$ possible.","text_assured":"Ellipse, not a segment: $\\det=2\\neq0$ guarantees the image stays 2-dimensional, exactly the condition $A^{-1}$ needs to exist.","emphasize":true},{"at_progress":0.8,"text":"Compare that to the dashed grey arrows: the matrix $\\begin{pmatrix}2&1\\\\4&2\\end{pmatrix}$, determinant 0, crushes every one of them onto a single line. Once flattened, there is no way back — this arrow is invertible; the ghost is not.","text_shaken":"The dashed grey arrows show a different matrix, determinant 0. All sixteen collapse onto one line. Once that happens, nothing can spread them back out.","text_assured":"$\\det\\begin{pmatrix}2&1\\\\4&2\\end{pmatrix}=0$ — row 2 is $2\\times$ row 1, rank 1, image is a line. That information loss is exactly why no inverse exists.","emphasize":false,"trap":{"text":"Students try to compute the inverse of a matrix like the dashed ghost before checking whether its determinant is zero.","avoid":"Check $\\det(A)$ first, always. Here $\\det\\begin{pmatrix}3&1\\\\1&1\\end{pmatrix}=2\\neq0$, so $A^{-1}$ exists; the ghost's determinant is 0, so it never does."}}]}
```
