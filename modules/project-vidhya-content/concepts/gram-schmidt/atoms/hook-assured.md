---
# Alternative body for gram-schmidt.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: gram-schmidt.hook.assured
concept_id: gram-schmidt
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: gram-schmidt.hook
for_stance: assured
---

Gram-Schmidt fixes an order on the inputs: $u_1=v_1$, and each later $u_i$ subtracts its projection onto *every* $u_j$ already built ($j<i$), not just the previous one. Reorder the vectors and you get a different, equally valid orthogonal basis — not the same one recomputed.

The subspace equality holds at every intermediate step, not only at the end: $\text{span}(u_1,\ldots,u_i)=\text{span}(v_1,\ldots,v_i)$ for each $i$. That's what lets you stop early when a question only wants an orthogonal basis for a leading subspace.

```interactive-spec
{"v":1,"kind":"simulation","title":"Subtracting v2's shadow along u1=(1,1), one t at a time","x_expr":"2-t","y_expr":"-t","t_min":0,"t_max":1,"duration_sec":6,"view_box":{"x_min":-1,"x_max":2.5,"y_min":-1.5,"y_max":1.5},"narration_steps":[{"at_progress":0.0,"text":"This traces $v_2-t\\cdot\\text{proj}_{u_1}v_2$ as $t$ runs from 0 to 1, stripping away $v_2$'s component along $u_1=(1,1)$. At $t=0$ the point is still $v_2=(2,0)$.","text_shaken":"Watch the point start at $(2,0)$ — that's $v_2$. It's about to slide.","text_assured":"$\\text{proj}_{u_1}v_2=\\frac{v_2\\cdot u_1}{u_1\\cdot u_1}u_1=(1,1)$ here — the point traces $v_2-t(1,1)$.","emphasize":false},{"at_progress":0.5,"text":"Halfway there, at $(1.5,-0.5)$. Check the dot product with $u_1$: $1(1.5)+1(-0.5)=1$ — not zero yet. Subtracting only part of the projection does not reach orthogonality.","text_shaken":"At the halfway point, $u_1\\cdot(1.5,-0.5)=1$. Still not zero.","text_assured":"A partial subtraction leaves a nonzero component along $u_1$ — orthogonality is exact only at $t=1$, never partway.","emphasize":false,"trap":{"text":"Students stop partway — eyeballing 'roughly perpendicular' — and move on without checking the dot product.","avoid":"Compute the exact coefficient $c=\\frac{v_2\\cdot u_1}{u_1\\cdot u_1}$ and subtract $c\\,u_1$ in full — never an estimated fraction."}},{"at_progress":0.85,"text":"One more step to $t=1$. Will the dot product with $u_1$ land at exactly zero, or just get close without ever hitting it?","text_shaken":"The point is almost there. Will $u_1\\cdot(2-t,-t)$ hit exactly $0$ at $t=1$, or only get close?","text_assured":"Full subtraction of the projection is coming up — does that guarantee $u_1\\cdot u_2=0$ exactly, or only approximately?","emphasize":false},{"at_progress":1.0,"text":"Yes — at $t=1$ the point lands at $(1,-1)$: exactly orthogonal to $u_1=(1,1)$, since $1(1)+1(-1)=0$. That's $u_2$, the direction Gram-Schmidt keeps.","text_shaken":"Yes. At $t=1$: point is $(1,-1)$. Check: $1(1)+1(-1)=0$. Orthogonal — this is $u_2$.","text_assured":"Yes — $u_2=(1,-1)$, and $u_1\\cdot u_2=0$ exactly: the full projection, subtracted once, is always enough.","emphasize":true}]}
```
