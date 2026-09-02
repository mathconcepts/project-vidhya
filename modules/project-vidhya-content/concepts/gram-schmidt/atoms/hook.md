---
id: gram-schmidt.hook
concept_id: gram-schmidt
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Two skewed axes walk into a room and leave at right angles. Give Gram-Schmidt any two independent vectors and it hands back two that are perpendicular but still span the exact same plane — nothing added, nothing lost, just straightened out. The trick is one subtraction: strip away whatever part of the second vector already points along the first, and what's left is guaranteed orthogonal to it. Watch $v_1=(1,1)$ stay put while $v_2=(2,0)$ sheds its shadow along $v_1$ until it lands at exactly 90°.

```interactive-spec
{"v":1,"kind":"simulation","title":"Subtracting v2's shadow along u1=(1,1), one t at a time","x_expr":"2-t","y_expr":"-t","t_min":0,"t_max":1,"duration_sec":6,"view_box":{"x_min":-1,"x_max":2.5,"y_min":-1.5,"y_max":1.5},"narration_steps":[{"at_progress":0.0,"text":"This traces $v_2-t\\cdot\\text{proj}_{u_1}v_2$ as $t$ runs from 0 to 1, stripping away $v_2$'s component along $u_1=(1,1)$. At $t=0$ the point is still $v_2=(2,0)$.","text_shaken":"Watch the point start at $(2,0)$ — that's $v_2$. It's about to slide.","text_assured":"$\\text{proj}_{u_1}v_2=\\frac{v_2\\cdot u_1}{u_1\\cdot u_1}u_1=(1,1)$ here — the point traces $v_2-t(1,1)$.","emphasize":false},{"at_progress":0.5,"text":"Halfway there, at $(1.5,-0.5)$. Check the dot product with $u_1$: $1(1.5)+1(-0.5)=1$ — not zero yet. Subtracting only part of the projection does not reach orthogonality.","text_shaken":"At the halfway point, $u_1\\cdot(1.5,-0.5)=1$. Still not zero.","text_assured":"A partial subtraction leaves a nonzero component along $u_1$ — orthogonality is exact only at $t=1$, never partway.","emphasize":false,"trap":{"text":"Students stop partway — eyeballing 'roughly perpendicular' — and move on without checking the dot product.","avoid":"Compute the exact coefficient $c=\\frac{v_2\\cdot u_1}{u_1\\cdot u_1}$ and subtract $c\\,u_1$ in full — never an estimated fraction."}},{"at_progress":1.0,"text":"At $t=1$ the point lands at $(1,-1)$: exactly orthogonal to $u_1=(1,1)$, since $1(1)+1(-1)=0$. That's $u_2$ — the direction Gram-Schmidt keeps.","text_shaken":"At $t=1$: point is $(1,-1)$. Check: $1(1)+1(-1)=0$. Orthogonal — this is $u_2$.","text_assured":"$u_2=(1,-1)$, and $u_1\\cdot u_2=0$ exactly — the full projection, subtracted once, is always enough.","emphasize":true}]}
```
