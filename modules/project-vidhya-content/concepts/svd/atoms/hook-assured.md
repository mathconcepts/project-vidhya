---
# Alternative body for svd.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: svd.hook.assured
concept_id: svd
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: svd.hook
for_stance: assured
---

## The decomposition that never refuses a matrix

$A = U\Sigma V^T$ exists for every matrix, square or not, invertible or not — where spectral decomposition demands symmetry, SVD asks for nothing. Singular values are eigenvalues of $A^TA$, square-rooted; $U$, $V$ are the eigenvectors of $AA^T$, $A^TA$ respectively.

Rank is singular values that survive nonzero; low-rank approximation is truncating the sum after the largest few. Where does that truncation actually lose information, and how would you bound it?

```interactive-spec
{"v":1,"kind":"simulation","title":"What the singular values see that the eigenvalues miss","x_expr":"cos(t)+2*sin(t)","y_expr":"sin(t)","t_min":0,"t_max":6.28319,"duration_sec":7,"view_box":{"x_min":-2.5,"x_max":2.5,"y_min":-1.3,"y_max":1.3},"narration_steps":[{"at_progress":0.0,"text":"The unit circle, about to be pushed through the shear $A=\\begin{pmatrix}1&2\\\\0&1\\end{pmatrix}$. Both its eigenvalues are 1 — start here, at $(1,0)$.","text_shaken":"$A=\\begin{pmatrix}1&2\\\\0&1\\end{pmatrix}$, eigenvalues $1,1$. At $t=0$, the point $(1,0)$ maps to $(1,0)$ — unchanged.","text_assured":"A shear with eigenvalues $1,1$ — a defective matrix, one real eigen-direction only. Watch what its image circle actually does."},{"at_progress":0.19,"text":"Here the trace reaches its farthest point anywhere: length 2.414. In most directions the stretch is large — nothing like the eigenvalue 1 suggested.","text_shaken":"At $\\theta\\approx68°$, the image is $(2.23,0.93)$, length $2.414$. That number, not $1$, is the real stretch here.","text_assured":"$2.414=1+\\sqrt2$: the largest singular value $\\sigma_1$, found from $A^{\\mathrm T}A$, not from $A$'s own eigenvalues.","emphasize":true},{"at_progress":0.6,"text":"Compare the dashed unit circle — what \"eigenvalues are both 1\" would predict if it meant uniform scaling. The solid trace has already pulled out to length 2.07 here.","text_shaken":"Dashed circle: radius 1, always. Solid trace at this $\\theta$: length $2.07$. Same matrix, two different questions.","text_assured":"Eigenvalues describe $A$ acting on its OWN eigenvectors only; singular values describe what $A$ does to every direction — a shear has just one of the former and two of the latter.","trap":{"text":"Students see both eigenvalues equal to 1 and conclude the matrix barely stretches anything.","avoid":"Compute $A^{\\mathrm T}A$ and take square roots of ITS eigenvalues — that is what \"stretch\" means for a general matrix."}},{"at_progress":1.0,"text":"Back at $(1,0)$ — the loop closes. The honest stretch factors are the singular values, 2.414 and 0.414, not the plain eigenvalues 1 and 1.","text_shaken":"Back at $(1,0)$, unchanged again — that's the ONE safe direction. Everywhere else, use $\\sigma_1=2.414$, $\\sigma_2=0.414$.","text_assured":"$A=U\\Sigma V^{\\mathrm T}$ works for every matrix, defective or not, square or not — eigendecomposition does not."}],"ghost":{"x_expr":"cos(t)","y_expr":"sin(t)"}}
```
