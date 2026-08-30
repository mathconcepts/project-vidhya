---
# Alternative body for matrix-norms.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: matrix-norms.hook.assured
concept_id: matrix-norms
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: matrix-norms.hook
for_stance: assured
---

$\kappa(A)=\|A\|\cdot\|A^{-1}\|$ bounds how much a relative error in $b$ can be amplified into a relative error in $x$, for $Ax=b$. $\kappa(A)\approx1$ is well-conditioned; $\kappa(A)\gg1$ means numerically unreliable even when $A$ is technically invertible — ill-conditioning is a spectrum, not a binary with singularity.

```interactive-spec
{"v":1,"kind":"simulation","title":"How far the unit circle actually stretches","x_expr":"4*cos(t)+sin(t)","y_expr":"2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":7,"view_box":{"x_min":-18,"x_max":18,"y_min":-18,"y_max":18},"narration_steps":[{"at_progress":0.0,"text":"$A=\\begin{pmatrix}4&1\\\\0&2\\end{pmatrix}$ pushing the unit circle out. Due east, the image already reaches 4.","text_shaken":"$A=\\begin{pmatrix}4&1\\\\0&2\\end{pmatrix}$. At $\\theta=0$, image is $(4,0)$, length 4.","text_assured":"The image of the unit circle under $A$ — its farthest reach, over every direction, is $\\|A\\|_2$ by definition."},{"at_progress":0.05,"text":"Turning slightly, the trace hits its farthest point anywhere: length 4.159. That number is the spectral norm $\\|A\\|_2$ — the true worst-case stretch.","text_shaken":"At $\\theta\\approx18°$, image is $(4.11,0.62)$, length $4.159$. That is $\\|A\\|_2$, computed and done.","text_assured":"$\\|A\\|_2=\\sigma_{\\max}=\\sqrt{\\lambda_{\\max}(A^{\\mathrm T}A)}\\approx4.16$ — the square root is not optional.","emphasize":true},{"at_progress":0.6,"text":"Now compare the huge dashed circle, radius 17.30 — that's $\\lambda_{\\max}(A^{\\mathrm T}A)$ used directly, with the square root forgotten. The real trace never leaves the small ellipse near the center.","text_shaken":"Dashed circle: radius $17.30$. Solid ellipse: it never goes past $4.16$. Forgetting $\\sqrt{\\ }$ overshoots by more than $4\\times$.","text_assured":"$\\lambda_{\\max}(A^{\\mathrm T}A)\\approx17.30$ is the SQUARE of the norm, not the norm — mixing them up wrecks every $\\kappa_2$ that follows.","trap":{"text":"Students compute $\\lambda_{\\max}(A^{\\mathrm T}A)\\approx17.30$ and report it directly as $\\|A\\|_2$.","avoid":"Take the square root: $\\|A\\|_2=\\sqrt{\\lambda_{\\max}(A^{\\mathrm T}A)}$, never $\\lambda_{\\max}$ itself."}},{"at_progress":1.0,"text":"Back at 4 — the honest spectral norm is $\\sigma_{\\max}\\approx4.16$, and $\\kappa_2(A)=\\sigma_{\\max}/\\sigma_{\\min}\\approx2.16$ follows the same way, both singular values, both square-rooted.","text_shaken":"Back at length 4. $\\|A\\|_2\\approx4.16$, $\\sigma_{\\min}\\approx1.92$, $\\kappa_2\\approx2.16$ — every one of these needed the square root.","text_assured":"$\\kappa_2(A)=\\sigma_{\\max}/\\sigma_{\\min}$ is a ratio of singular values, never of the eigenvalues of $A^{\\mathrm T}A$ directly."}],"ghost":{"x_expr":"17.30074*cos(t)","y_expr":"17.30074*sin(t)"}}
```
