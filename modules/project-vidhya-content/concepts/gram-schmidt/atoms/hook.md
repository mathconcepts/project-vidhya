---
id: gram-schmidt.hook
concept_id: gram-schmidt
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Three vectors can span exactly the space you want and still be miserable to compute with, leaning against one another at odd angles so that every calculation drags in a system of simultaneous equations. Gram-Schmidt straightens them out: take each vector in turn, subtract off its shadow on everything already fixed, normalise, repeat. Same span, right angles throughout.

```interactive-spec
{"v":1,"kind":"simulation","title":"Subtracting v2's shadow on e1 — Gram-Schmidt's first step","x_expr":"1-t","y_expr":"1","t_min":0,"t_max":1,"duration_sec":6,"view_box":{"x_min":-0.3,"x_max":1.3,"y_min":-0.3,"y_max":1.3},"narration_steps":[{"at_progress":0.0,"text":"Start at $v_2=(1,1)$; $v_1=(1,0)$ is already unit length, so $e_1=(1,0)$.","text_shaken":"$v_2=(1,1)$. $e_1=(1,0)$ needs no scaling — its length is already 1.","text_assured":"Normalize first if $v_1$ isn't unit — the order matters for the arithmetic, not for which vector you project against."},{"at_progress":0.35,"text":"The point slides left, subtracting $v_2$'s shadow on $e_1$: the projection $\\langle v_2,e_1\\rangle e_1=(1,0)$.","text_shaken":"At $(0.65,1)$: $0.35$ of the projection removed so far, $y$ untouched.","text_assured":"$\\langle v_2,e_1\\rangle=1$ here because $e_1$ is a unit vector — no division by $\\langle e_1,e_1\\rangle$ needed.","emphasize":true},{"at_progress":0.65,"text":"At $(0.35,1)$, only the $e_1$-component has been removed — this example has just one projection to subtract.","text_shaken":"$(0.35,1)$. One projection removed. That's all there is with two vectors.","text_assured":"With a third vector $v_3$, this same step repeats against BOTH $e_1$ and the new $e_2$ — not $e_1$ alone.","trap":{"text":"Once a third vector joins, students repeat this subtraction against $e_1$ and stop, forgetting to also subtract the projection onto $e_2$.","avoid":"Subtract every prior projection before normalizing: $\\tilde u_i=v_i-\\sum_{j<i}\\langle v_i,e_j\\rangle e_j$."}},{"at_progress":1.0,"text":"At $(0,1)$: orthogonal to $e_1$ and already unit length, so $e_2=(0,1)$ — same span, right angle.","text_shaken":"$(0,1)$ reached. Check: $\\langle e_1,e_2\\rangle=1\\times0+0\\times1=0$. Done, $e_2=(0,1)$.","text_assured":"$\\{e_1,e_2\\}$ spans exactly what $\\{v_1,v_2\\}$ did — Gram-Schmidt changes the basis, never the subspace."}]}
```
