---
id: jordan-normal-form.hook
concept_id: jordan-normal-form
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

When a matrix isn't diagonalizable, it's not worthless — it has structure hiding in plain sight. The Jordan Normal Form captures that structure with "almost-diagonal" Jordan blocks: the closest thing to diagonal form any matrix can achieve.

```interactive-spec
{"v":1,"kind":"simulation","title":"A repeated eigenvalue that still shears","x_expr":"2*cos(t)+sin(t)","y_expr":"2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":7,"view_box":{"x_min":-2.5,"x_max":2.5,"y_min":-2.3,"y_max":2.3},"narration_steps":[{"at_progress":0.0,"text":"$J=\\begin{pmatrix}2&1\\\\0&2\\end{pmatrix}$ has a repeated eigenvalue, $\\lambda=2,2$. At $\\theta=0$, the image sits at $(2,0)$ — matching a plain scaling by 2, so far.","text_shaken":"$J=\\begin{pmatrix}2&1\\\\0&2\\end{pmatrix}$, eigenvalue $2$ twice. At $\\theta=0$: image $(2,0)$.","text_assured":"$\\lambda=2$ with algebraic multiplicity 2 — the question is whether the geometric multiplicity matches."},{"at_progress":0.25,"text":"A quarter turn on, $J$'s image sits at $(1,2)$ — length 2.236, not 2. The dashed circle for pure scaling $2I$ is still exactly at $(0,2)$, length 2.","text_shaken":"At $\\theta=90°$, $J$ gives $(1,2)$, length $2.236$. $2I$ gives $(0,2)$, length $2$. Already different.","text_assured":"The gap between $J$'s trace and the dashed circle at this point is the shear — the extra 1 in $J$'s corner, acting."},{"at_progress":0.6,"text":"The gap keeps widening — $J$'s trace reaches 2.500 here, while the dashed circle for uniform scaling by 2 stays fixed at exactly 2.","text_shaken":"At this $\\theta$, $J$ gives length $2.500$; $2I$ gives length $2.000$. Same repeated eigenvalue, different pictures.","text_assured":"Repeated eigenvalue $\\Rightarrow$ diagonalizable is the missing step: only distinct eigenvalues guarantee it outright.","emphasize":true,"trap":{"text":"Students see the repeated eigenvalue 2 and assume $J$ acts like uniform scaling, matching $2I$.","avoid":"Solve $(J-2I)v=0$ and count independent solutions — one solution here means one Jordan block, not a diagonal matrix."}},{"at_progress":1.0,"text":"Only back at $\\theta=0$ does $J$'s trace touch the dashed circle again — that single direction is $J$'s only eigenvector. Everywhere else, the shear shows.","text_shaken":"Back at $(2,0)$ — the only point where $J$ and $2I$ agree. That's geometric multiplicity 1, not 2.","text_assured":"Geometric multiplicity 1 against algebraic multiplicity 2 is exactly what forces a Jordan block instead of a diagonal matrix."}],"ghost":{"x_expr":"2*cos(t)","y_expr":"2*sin(t)"}}
```
