---
# Alternative body for matrix-norms.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: matrix-norms.hook.shaken
concept_id: matrix-norms
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: matrix-norms.hook
for_stance: shaken
---

For $A=\begin{pmatrix}2&0\\0&0.5\end{pmatrix}$: the arrow pointing right grows to length $2$. The arrow pointing up shrinks to length $0.5$. The matrix norm is the biggest of those numbers: $2$. That's the farthest any length-one arrow can reach after this matrix.

```interactive-spec
{"v":1,"kind":"simulation","title":"Sixteen arrows meet [[2,0],[0,0.5]] — the widest stretch is the norm","duration_sec":9,"linear_map":{"matrix":[[2,0],[0,0.5]],"num_vectors":16,"eigen":[{"dir":[1,0],"value":2},{"dir":[0,1],"value":0.5}]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows are about to meet the matrix $\\begin{pmatrix}2&0\\\\0&0.5\\end{pmatrix}$. One direction is about to grow a lot; another is about to shrink.","text_shaken":"Sixteen arrows on a circle. This matrix stretches some and shrinks others — watch by how much.","text_assured":"Diagonal and positive: the eigenvalues ARE the singular values here — no rotation to untangle, just two stretch factors.","emphasize":false},{"at_progress":0.22,"text":"Push! The arrows pointing right grow longer; the arrows pointing up shrink shorter. The circle is stretching into a flat ellipse.","text_shaken":"Watch the circle change shape: it's stretching sideways and getting squashed top to bottom.","text_assured":"$A$ acts diagonally on the standard basis: $x$-components scale by $2$, $y$-components scale by $0.5$ — no mixing.","emphasize":false},{"at_progress":0.55,"text":"The arrow along $(1,0)$ stretched to exactly $2$ — the widest any arrow gets stretched. The arrow along $(0,1)$ shrank to exactly $0.5$ — the narrowest.","text_shaken":"Check the sideways arrow: it's now length $2$, the longest one on screen. Check the upward arrow: it's now length $0.5$, the shortest.","text_assured":"$\\sigma_{\\max}=2$, $\\sigma_{\\min}=0.5$ — no need for $A^TA$ here since $A$ is already diagonal with positive entries.","emphasize":true},{"at_progress":0.8,"text":"The matrix norm is that widest stretch — here exactly $2$, the longest radius the ellipse reaches. Nothing in any direction ever gets pushed farther than that.","text_shaken":"One line to keep: the norm is the biggest stretch a matrix can do to a length-1 arrow. Here, that's $2$.","text_assured":"$\\|A\\|_2=\\sigma_{\\max}=2$ by definition — the ellipse's semi-major axis, read straight off the picture.","emphasize":false,"trap":{"text":"Students assume $\\|A^{-1}\\|=1/\\|A\\|$, predicting $1/2=0.5$. But $\\|A^{-1}\\|_2$ uses the SMALLEST stretch, not the largest: $1/\\sigma_{\\min}=1/0.5=2$.","avoid":"Use $\\|A^{-1}\\|_2=1/\\sigma_{\\min}(A)$, never $1/\\|A\\|_2$ — the inverse's norm is governed by the direction $A$ shrinks the most."}}]}
```
