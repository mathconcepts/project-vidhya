---
# Alternative body for inner-product-spaces.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: inner-product-spaces.hook.shaken
concept_id: inner-product-spaces
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: inner-product-spaces.hook
for_stance: shaken
---

You already know one: the dot product. $(1,2)\cdot(3,1) = 1(3)+2(1) = 5$.

An inner product is that recipe — multiply matching pieces, add — applied beyond arrows: to polynomials, functions, matrices too.

Once you have one, orthogonality and length come free: two things are perpendicular exactly when their inner product is zero.

```interactive-spec
{"v":1,"kind":"simulation","title":"The angle between a fixed u=(1,0) and a rotating v=(cos t, sin t)","x_expr":"cos(t)","y_expr":"sin(t)","t_min":0,"t_max":6.28319,"duration_sec":7,"view_box":{"x_min":-1.3,"x_max":1.3,"y_min":-1.3,"y_max":1.3},"narration_steps":[{"at_progress":0.0,"text":"This traces $v=(\\cos t,\\sin t)$ sweeping one full turn; $u=(1,0)$ stays fixed along the positive $x$-axis.","text_shaken":"$v$ starts at $(1,0)$, same as $u$. Watch $\\langle u,v\\rangle=\\cos t$ as $v$ turns.","text_assured":"$\\langle u,v\\rangle=u_1v_1+u_2v_2=\\cos t$ here since $u=(1,0)$ — the standard real inner product."},{"at_progress":0.25,"text":"$v=(0,1)$ is perpendicular to $u$, so $\\langle u,v\\rangle=\\cos90°=0$. Is that zero the smallest $|\\langle u,v\\rangle|$ gets here, or the largest?","text_shaken":"$v=(0,1)$ now. $\\langle u,v\\rangle=0$. Is zero the smallest this quantity gets on the circle, or the largest?","text_assured":"$\\langle u,v\\rangle=0$ at perpendicularity. Does that make $|\\langle u,v\\rangle|\\le\\|u\\|\\|v\\|$ tightest here, or loosest?"},{"at_progress":0.35,"text":"It's the smallest — the minimum, not a special maximum. Cauchy–Schwarz equality, $|\\langle u,v\\rangle|=\\|u\\|\\|v\\|$, lives elsewhere on this circle, not at this perpendicular point.","text_shaken":"Smallest. $\\langle u,v\\rangle=0$ is the minimum size, not a special case. Equality with $\\|u\\|\\|v\\|$ happens somewhere else on the circle.","text_assured":"$|\\langle u,v\\rangle|\\le\\|u\\|\\|v\\|$ is loosest here — Cauchy–Schwarz equality lives elsewhere on this circle, not at this point.","trap":{"text":"Students read this zero-at-perpendicularity moment as the Cauchy–Schwarz equality case.","avoid":"Equality $|\\langle u,v\\rangle|=\\|u\\|\\|v\\|$ holds only when $u,v$ are parallel (linearly dependent), never when they're orthogonal."}},{"at_progress":0.45,"text":"$v$ is about to point exactly opposite $u$, at $(-1,0)$. Does Cauchy–Schwarz equality need $v$ pointing the SAME way as $u$, or does opposite count too?","text_shaken":"$v$ is heading to $(-1,0)$ — straight opposite $u$. Does equality need $v$ pointing the same way as $u$, or does opposite count too?","text_assured":"$v\\to(-1,0)$, antiparallel to $u$. Does Cauchy–Schwarz equality require $v\\parallel u$ in the same sense, or just linear dependence, any sign?"},{"at_progress":0.5,"text":"Opposite counts too. At $v=(-1,0)$: $\\langle u,v\\rangle=-1$ and $|\\langle u,v\\rangle|=\\|u\\|\\|v\\|=1$ — equality holds even antiparallel, since $v=-u$ is still linearly dependent.","text_shaken":"Yes, opposite counts. $v=(-1,0)$. $\\langle u,v\\rangle=-1$. $|-1|=1\\times1$ — equality, exactly here.","text_assured":"Antiparallel still counts as linearly dependent ($v=-u$), so Cauchy–Schwarz equality is exact, sign and all.","emphasize":true},{"at_progress":1.0,"text":"Back at $v=(1,0)$, parallel to $u$ again: $\\langle u,v\\rangle=1=\\|u\\|\\|v\\|$ — equality recurs only where the two vectors line up.","text_shaken":"Full turn done, $v=(1,0)$. $\\langle u,v\\rangle=1$. Equality happened twice: parallel and antiparallel — never at 90°.","text_assured":"Equality traces out exactly two points on this circle — the two directions proportional to $u$ — nowhere else."}]}
```
