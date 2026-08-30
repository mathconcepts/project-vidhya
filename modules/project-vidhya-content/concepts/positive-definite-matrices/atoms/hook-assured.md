---
# Alternative body for positive-definite-matrices.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: positive-definite-matrices.hook.assured
concept_id: positive-definite-matrices
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: positive-definite-matrices.hook
for_stance: assured
---

$x^TAx > 0$ for every nonzero $x$ is the definition; eigenvalues all positive and Sylvester's leading-minors test are equivalent characterizations, not separate facts to memorize — pick whichever the question hands you cheaply.

Positive semidefinite (eigenvalues $\ge 0$, minors $\ge 0$) is the trap variant: a single zero eigenvalue breaks strict positivity but leaves Cholesky needing a rank-deficient variant. Where does that distinction actually bite in an optimization or covariance question?

```interactive-spec
{"v":1,"kind":"simulation","title":"Sweeping the quadratic form: bowl or saddle?","x_expr":"(1+cos(t)^2)*cos(t)","y_expr":"(1+cos(t)^2)*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":7,"view_box":{"x_min":-4.2,"x_max":4.2,"y_min":-4.2,"y_max":4.2},"narration_steps":[{"at_progress":0.0,"text":"This traces how far $Q(\\mathbf{x})=\\mathbf{x}^{\\mathrm T}A\\mathbf{x}$ reaches in every direction, for $A=\\begin{pmatrix}2&0\\\\0&1\\end{pmatrix}$ — due east, it reaches 2.","text_shaken":"At $\\theta=0$, $A=\\begin{pmatrix}2&0\\\\0&1\\end{pmatrix}$ gives $Q=2$. One point at a time.","text_assured":"$Q(\\mathbf{x})=\\mathbf{x}^{\\mathrm T}A\\mathbf{x}$ swept over every direction — this IS the definiteness test, not a side computation."},{"at_progress":0.6,"text":"All the way round, the curve stays between 1 and 2 — every direction curves upward, never touching zero. That is what positive definite looks like.","text_shaken":"From $\\theta=0$ to $2\\pi$, $Q$ for $A$ stays between 1 and 2. Never zero, never negative — write that down.","text_assured":"Positive for every $\\theta$ is the full content of \"positive definite\" — equivalent to all eigenvalues $>0$ and to all of Sylvester's minors $>0$."},{"at_progress":0.8,"text":"Now watch the dashed curve for $B=\\begin{pmatrix}1&3\\\\3&1\\end{pmatrix}$ — same positive diagonal, but it plunges through the origin here. $B$'s eigenvalues are $4,-2$: a saddle.","text_shaken":"For $B=\\begin{pmatrix}1&3\\\\3&1\\end{pmatrix}$ at this angle, $Q=-0.76$. Negative. $B$'s diagonal being $1,1$ told you nothing about this.","text_assured":"Positive diagonal entries are necessary for positive definiteness, never sufficient — $B$ clears that bar and is still indefinite.","trap":{"text":"Students read $B$'s positive diagonal entries (1 and 1) as proof it is positive definite.","avoid":"Check the leading principal minors, or verify every eigenvalue is positive — never diagonal entries alone."},"emphasize":true},{"at_progress":1.0,"text":"Back at the start, both curves sit above zero again — one safe direction proves nothing. Only a test that holds for every direction (Sylvester's minors, or all eigenvalues) proves it.","text_shaken":"Both curves are positive again here. One positive point proves nothing — check all leading minors before deciding.","text_assured":"One safe direction, or one safe entry, proves nothing globally — the criterion must hold for every direction, exactly what the minors test checks in one pass."}],"ghost":{"x_expr":"(1+3*sin(2*t))*cos(t)","y_expr":"(1+3*sin(2*t))*sin(t)"}}
```
