---
# Alternative body for quadratic-forms.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: quadratic-forms.hook.assured
concept_id: quadratic-forms
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: quadratic-forms.hook
for_stance: assured
---

$f(\mathbf{x})=\mathbf{x}^TA\mathbf{x}$ classifies by the sign pattern of $A$'s eigenvalues — all positive (positive definite), all negative (negative definite), mixed (indefinite), any zero (semidefinite). Classification is an eigenvalue question dressed as a polynomial one, and every algorithm in the topic exists to avoid computing the eigenvalues directly when a shortcut applies.

```interactive-spec
{"v":1,"kind":"simulation","title":"Q(x,y)=x^2+4xy+y^2 swept around the unit circle — sign changes with direction","x_expr":"cos(t)","y_expr":"sin(t)","t_min":0,"t_max":6.28319,"duration_sec":7,"view_box":{"x_min":-1.3,"x_max":1.3,"y_min":-1.3,"y_max":1.3},"narration_steps":[{"at_progress":0.0,"text":"This traces $(\\cos t,\\sin t)$ around a full turn; at $(1,0)$, $Q=x^2+4xy+y^2=1$.","text_shaken":"$(1,0)$. $Q=1^2+0+0=1$. Positive here.","text_assured":"$Q$ is a quadratic form on the unit circle — its range there is exactly $[\\lambda_{\\min},\\lambda_{\\max}]$ of the matrix."},{"at_progress":0.125,"text":"At $(0.71,0.71)$, $Q=3$ — the largest value $Q$ reaches on this circle.","text_shaken":"$(0.71,0.71)$. $Q=0.5+2+0.5=3$. The biggest number this form produces here.","text_assured":"$3$ is the top eigenvalue of $A=\\begin{pmatrix}1&2\\\\2&1\\end{pmatrix}$ — the maximum of $Q$ on the unit circle always equals $\\lambda_{\\max}$.","emphasize":true},{"at_progress":0.25,"text":"At $(0,1)$, $Q=1$ again — positive, same as the start, even though the direction is completely different.","text_shaken":"$(0,1)$. $Q=0+0+1=1$. Positive again.","text_assured":"Positive at two very different directions doesn't imply positive everywhere — keep sweeping before concluding definiteness."},{"at_progress":0.875,"text":"At $(0.71,-0.71)$, $Q=-1$ — negative. The same matrix that gave $Q=3$ at 45° now gives a negative number.","text_shaken":"$(0.71,-0.71)$. $Q=0.5-2+0.5=-1$. Negative.","text_assured":"$-1$ is the OTHER eigenvalue of $A$ — one positive, one negative is exactly what indefinite means.","trap":{"text":"Students see the positive diagonal entries of $A=\\begin{pmatrix}1&2\\\\2&1\\end{pmatrix}$ and assume positive definiteness without checking every direction.","avoid":"Check the eigenvalues or Sylvester's leading minors, not the diagonal — here they're $3$ and $-1$, so the form is indefinite."}},{"at_progress":1.0,"text":"Back at $(1,0)$, $Q=1$: positive here, negative at 135° and 315° — indefinite, because $A$'s eigenvalues have opposite signs.","text_shaken":"Full turn done, back to $Q=1$. Sign flips twice per revolution — never zero, only sign.","text_assured":"A form is positive definite only when EVERY direction gives $Q>0$ — one negative direction, anywhere, makes it indefinite."}]}
```
