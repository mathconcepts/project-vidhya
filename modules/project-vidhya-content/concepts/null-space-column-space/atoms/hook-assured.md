---
# Alternative body for null-space-column-space.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: null-space-column-space.hook.assured
concept_id: null-space-column-space
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: null-space-column-space.hook
for_stance: assured
---

$\text{Null}(A)=\{x:Ax=0\}$; $\text{Col}(A)=\{Ax:x\in\mathbb{R}^n\}$ — the kernel and the image of the same map. $\dim\text{Null}(A)+\dim\text{Col}(A)=n$ (rank-nullity), so the two dimensions trade off directly: shrink one and the other grows.

```interactive-spec
{"v":1,"kind":"simulation","title":"Null space crushes to zero; column space is the one line everything lands on","x_expr":"cos(t) + 2*sin(t)","y_expr":"2*cos(t) + 4*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":7,"view_box":{"x_min":-2.6,"x_max":2.6,"y_min":-5.1,"y_max":5.1},"narration_steps":[{"at_progress":0,"text":"This traces the image of the unit circle under $A=\\begin{pmatrix}1&2\\\\2&4\\end{pmatrix}$. At $t=0$: $(1,2)$ — every image point, it turns out, will fall on this same line.","text_shaken":"At $t=0$: point $(1,2)$. Multiply anything by $A$ and you land somewhere on this line — watch.","text_assured":"$A$ has rank $1$ here (row two is exactly twice row one), so its entire output — the column space — is one line, not a plane.","emphasize":false},{"at_progress":0.2,"text":"By $t=72°$: $(2.21,4.42)$ — still exactly on the line $y=2x$. Every direction fed in lands somewhere on this one line: the column space.","text_shaken":"At $t=72°$: $(2.21,4.42)$. Check: $4.42=2\\times2.21$. Same line as before.","text_assured":"The column space is spanned by $A$'s own columns, $(1,2)$ and $(2,4)$ — both already on this line, which is why the whole image collapses onto it.","emphasize":false},{"at_progress":0.4262,"text":"At $t\\approx153°$: the input direction $(-2,1)$ — same line as $(2,-1)$ — lands at $(0,0)$ exactly. That whole direction of inputs gets crushed to nothing: the null space.","text_shaken":"At $t\\approx153°$: input direction $(-2,1)$, output $(0,0)$. Gone. Crushed to the origin.","text_assured":"$(-2,1)$ solves $Ax=0$ exactly — the null space direction, one full dimension of input that carries zero information through $A$.","emphasize":true,"trap":{"text":"Students sometimes take a column of $A$ — like $(1,2)$ — and treat it as a null space vector; but that column IS the direction the output lands on, not the direction that vanishes.","avoid":"Solve $Ax=0$ directly (row-reduce first); never reuse a column of $A$ as if it were a null-space vector."}},{"at_progress":0.85,"text":"By $t=306°$: back on the line at $(-1.03,-2.06)$. One input direction vanished (null space, dimension $1$); everything else lands on one line (column space, dimension $1$) — $1+1=2$, the full input dimension.","text_shaken":"At $t=306°$: $(-1.03,-2.06)$ — on the line again. One direction in vanishes; everything else lands on this one line.","text_assured":"Rank-nullity: $\\dim(\\text{null space})+\\dim(\\text{column space})=n=2$ — here, exactly $1+1$, visible in this one picture.","emphasize":false}]}
```
