---
id: inner-product-spaces.hook
concept_id: inner-product-spaces
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

You already know one: $(1,2)\cdot(3,1) = 5$. The dot product is what lets you say that two arrows are perpendicular, or how long one of them is. Now ask for those same powers over polynomials, or over functions, where there are no arrows to point at. An inner product is that recipe abstracted far enough to answer — and length, angle, orthogonality and projection all come back with it.

```interactive-spec
{"v":1,"kind":"simulation","title":"The angle between a fixed u=(1,0) and a rotating v=(cos t, sin t)","x_expr":"cos(t)","y_expr":"sin(t)","t_min":0,"t_max":6.28319,"duration_sec":7,"view_box":{"x_min":-1.3,"x_max":1.3,"y_min":-1.3,"y_max":1.3},"narration_steps":[{"at_progress":0.0,"text":"This traces $v=(\\cos t,\\sin t)$ sweeping one full turn; $u=(1,0)$ stays fixed along the positive $x$-axis.","text_shaken":"$v$ starts at $(1,0)$, same as $u$. Watch $\\langle u,v\\rangle=\\cos t$ as $v$ turns.","text_assured":"$\\langle u,v\\rangle=u_1v_1+u_2v_2=\\cos t$ here since $u=(1,0)$ — the standard real inner product."},{"at_progress":0.25,"text":"At $v=(0,1)$, $v\\perp u$: $\\langle u,v\\rangle=\\cos90°=0$ — the smallest $|\\langle u,v\\rangle|$ ever gets, not the largest.","text_shaken":"$v=(0,1)$ now. $\\langle u,v\\rangle=0$. That's the minimum size, not a special maximum.","text_assured":"$|\\langle u,v\\rangle|\\le\\|u\\|\\|v\\|$ is loosest here — Cauchy–Schwarz equality lives elsewhere on this circle, not at this point.","trap":{"text":"Students read this zero-at-perpendicularity moment as the Cauchy–Schwarz equality case.","avoid":"Equality $|\\langle u,v\\rangle|=\\|u\\|\\|v\\|$ holds only when $u,v$ are parallel (linearly dependent), never when they're orthogonal."}},{"at_progress":0.5,"text":"At $v=(-1,0)$, antiparallel to $u$: $\\langle u,v\\rangle=-1$ and $|\\langle u,v\\rangle|=\\|u\\|\\|v\\|=1$ — equality holds.","text_shaken":"$v=(-1,0)$. $\\langle u,v\\rangle=-1$. $|-1|=1\\times1$ — equality, exactly here.","text_assured":"Antiparallel still counts as linearly dependent ($v=-u$), so Cauchy–Schwarz equality is exact, sign and all.","emphasize":true},{"at_progress":1.0,"text":"Back at $v=(1,0)$, parallel to $u$ again: $\\langle u,v\\rangle=1=\\|u\\|\\|v\\|$ — equality recurs only where the two vectors line up.","text_shaken":"Full turn done, $v=(1,0)$. $\\langle u,v\\rangle=1$. Equality happened twice: parallel and antiparallel — never at 90°.","text_assured":"Equality traces out exactly two points on this circle — the two directions proportional to $u$ — nowhere else."}]}
```
