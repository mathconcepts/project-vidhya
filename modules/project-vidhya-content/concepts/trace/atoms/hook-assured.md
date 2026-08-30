---
# Alternative body for trace.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: trace.hook.assured
concept_id: trace
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: trace.hook
for_stance: assured
---

$\text{tr}(A)=\sum_i a_{ii}=\sum_i \lambda_i$ — diagonal sum equals eigenvalue sum, for free, without factoring the characteristic polynomial. It's basis-independent ($\text{tr}(P^{-1}AP)=\text{tr}(A)$) and satisfies $\text{tr}(AB)=\text{tr}(BA)$ even though $AB\neq BA$ in general — a fast consistency check on any eigenvalue computation.

```interactive-spec
{"v":1,"kind":"simulation","title":"Two stretch factors that always sum to the diagonal: eigen-directions of A=[[5,1],[2,4]]","x_expr":"5*cos(t) + sin(t)","y_expr":"2*cos(t) + 4*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":7,"view_box":{"x_min":-5.8,"x_max":5.8,"y_min":-5.1,"y_max":5.1},"narration_steps":[{"at_progress":0,"text":"This traces the image of the unit circle under $A=\\begin{pmatrix}5&1\\\\2&4\\end{pmatrix}$. At $t=0$: the point $(5,2)$ — column one of $A$. The diagonal entries are $5$ and $4$.","text_shaken":"At $t=0$: point $(5,2)$. The diagonal of $A$ reads $5$ and $4$ — remember those two numbers.","text_assured":"The diagonal ($5,4$) will turn out to equal the sum of the eigenvalues you're about to see — no factoring needed for that check.","emphasize":false},{"at_progress":0.125,"text":"At $t=45°$: the point lands at $(4.24,4.24)$ — exactly $6\\times$ the input direction $(1,1)$. Eigenvalue $6$.","text_shaken":"At $t=45°$: input direction $(1,1)$, output $(4.24,4.24)$ — six times as far. Eigenvalue $6$.","text_assured":"$(1,1)$ satisfies $Av=6v$ exactly — the first of two eigenvalues that will sum to the trace.","emphasize":true},{"at_progress":0.65,"text":"At $t=234°$: an ordinary point, about $(-3.75,-4.41)$ — direction and length both changed, no special stretch factor here.","text_shaken":"At this point, roughly $(-3.75,-4.41)$ — nothing special, just an ordinary point on the warped circle.","text_assured":"Away from the two eigen-directions, no scalar $\\lambda$ satisfies $Av=\\lambda v$ — the defining test eigenvalues must pass.","emphasize":false,"trap":{"text":"Students sum ALL four entries of $A$ — $5+1+2+4=12$ — and call it the trace; the trace uses only the DIAGONAL, $5+4=9$, ignoring the off-diagonal $1$ and $2$ entirely.","avoid":"Circle just the diagonal entries before adding — off-diagonal entries never enter the trace."}},{"at_progress":0.824,"text":"At $t\\approx297°$: the point lands at $(1.35,-2.68)$ — exactly $3\\times$ the direction $(1,-2)$. Eigenvalue $3$ — and $6+3=9$, matching the diagonal sum $5+4=9$ exactly.","text_shaken":"At $t\\approx297°$: output $(1.35,-2.68)$, three times direction $(1,-2)$. Eigenvalue $3$. Now add: $6+3=9$. Diagonal: $5+4=9$. Same number.","text_assured":"$6+3=9=5+4$ — the trace, computable in one glance at the diagonal, always equals the sum of eigenvalues, however hard those are to find.","emphasize":true}]}
```
