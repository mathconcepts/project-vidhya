---
# Alternative body for symmetric-matrices.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: symmetric-matrices.hook.assured
concept_id: symmetric-matrices
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: symmetric-matrices.hook
for_stance: assured
---

$A = A^T$ buys you two guarantees no other matrix class gets automatically: real eigenvalues, and an orthogonal eigenbasis. Together they mean $A = Q\Lambda Q^T$ always exists — no defectiveness, no complex conjugate pairs, ever.

That's the entire reason symmetric matrices carry the theory: covariance, stiffness, Hessians — every quadratic-form application leans on this guarantee holding without exception.

```interactive-spec
{"v":1,"kind":"simulation","title":"The unit circle's image under a symmetric matrix — the ellipse's two axes are its eigenvectors","x_expr":"3*cos(t)+sin(t)","y_expr":"cos(t)+2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":7,"view_box":{"x_min":-3.4,"x_max":3.4,"y_min":-2.5,"y_max":2.5},"narration_steps":[{"at_progress":0.0,"text":"This traces the image of the unit circle under the symmetric matrix $A=\\begin{pmatrix}3&1\\\\1&2\\end{pmatrix}$ — every point on the circle, pushed through $A$.","text_shaken":"Start at $(1,0)$ on the unit circle. Apply $A=\\begin{pmatrix}3&1\\\\1&2\\end{pmatrix}$: the whole circle becomes this ellipse.","text_assured":"$A$ is symmetric ($A=A^T$), so its image of the circle is always an ellipse with perpendicular axes — never a sheared or rotated-off shape."},{"at_progress":0.088,"text":"At $(3.08,1.90)$ the curve is moving straight outward along direction $(0.85,0.53)$, stretched by exactly **3.618** — an eigenvector.","text_shaken":"Here the point is $(3.08,1.90)$, length $3.618$, and it points the same way it started: no turning, only stretching.","text_assured":"This is the major axis: eigenvalue $3.618$, the larger root of $\\lambda^2-5\\lambda+5=0$.","emphasize":true},{"at_progress":0.338,"text":"At $(-0.73,1.18)$ the curve crosses the second axis — direction $(-0.53,0.85)$, stretched by only **1.382**.","text_shaken":"Now at $(-0.73,1.18)$, length $1.382$ — the shorter axis of the ellipse.","text_assured":"Eigenvalue $1.382$, the smaller root — real, like the first, because $A$ is symmetric."},{"at_progress":0.6,"text":"Both axis directions found so far — $(0.85,0.53)$ and $(-0.53,0.85)$ — sit exactly 90° apart.","text_shaken":"Check: $0.85\\times(-0.53)+0.53\\times0.85=0$. The two directions are perpendicular.","text_assured":"Perpendicularity here isn't a coincidence of this matrix — it's forced whenever $A=A^T$ and the eigenvalues differ.","trap":{"text":"Students laboriously compute the dot product to verify these two eigenvectors are perpendicular.","avoid":"Skip the check: for symmetric $A$ with distinct eigenvalues, orthogonal eigenvectors are guaranteed by the spectral theorem."}},{"at_progress":1.0,"text":"One full turn traces the whole ellipse — both axes 90° apart, both eigenvalues real, both guaranteed by $A=A^T$.","text_shaken":"The ellipse closes back at $(1,0)$. Two real eigenvalues, two perpendicular axes — read straight off $A=A^T$.","text_assured":"This is the spectral theorem in one picture: $A=Q\\Lambda Q^T$ with $Q$ orthogonal, valid only because $A$ is symmetric."}]}
```
