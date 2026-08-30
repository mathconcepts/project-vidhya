---
id: rank-nullity.hook
concept_id: rank-nullity
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

A matrix takes an $n$-dimensional space in and does two things to it at once: some directions it carries through to genuinely new output, and some it crushes to zero. Count both and the total is always $n$ — no direction escapes the tally and none is counted twice. Rank plus nullity equals $n$ is that bookkeeping, and it is exact, never approximate.

```interactive-spec
{"v":1,"kind":"simulation","title":"Rank 1 + nullity 1 = 2: the circle folds onto a line","x_expr":"cos(t)+sin(t)","y_expr":"cos(t)+sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-1.8,"x_max":1.8,"y_min":-1.8,"y_max":1.8},"narration_steps":[{"at_progress":0.0,"text":"This matrix sends every point of the unit circle onto the same line, $y=x$ — the dot starts at $(1,1)$.","text_shaken":"The dot starts at $(1,1)$. Notice it already sits exactly on the line $y=x$.","text_assured":"Rank 1 shows up immediately: every output point lands on the single line $y=x$, not spread across the plane."},{"at_progress":0.125,"text":"At its farthest, the dot reaches $(\\sqrt2,\\sqrt2)$ — still on $y=x$, never off it.","text_shaken":"Farthest point: $(\\sqrt2,\\sqrt2)$, about $(1.41,1.41)$. Still exactly on the line.","text_assured":"The image is 1-dimensional: a whole circle of inputs compresses onto a single line, so $\\text{rank}(A)=1$."},{"at_progress":0.375,"text":"Here the dot passes through the origin — a nonzero input point mapped all the way down to zero.","text_shaken":"Right now the dot is at $(0,0)$. A real, nonzero point on the circle just got sent to zero.","text_assured":"Every point on the perpendicular line $y=-x$ maps to $(0,0)$ — that whole line is the kernel, and it's 1-dimensional.","emphasize":true,"trap":{"text":"Students count both rows of this matrix as independent and call the rank 2, missing that row 2 is a repeat of row 1.","avoid":"Compare the rows before counting: identical rows contribute only once to the rank — here that leaves rank 1, not 2."}},{"at_progress":0.625,"text":"At the opposite extreme, $(-\\sqrt2,-\\sqrt2)$ — the whole circle has folded onto one line with one dimension of freedom, matched by one dimension folded to zero.","text_shaken":"Now at $(-\\sqrt2,-\\sqrt2)$, about $(-1.41,-1.41)$. One line holds every output; rank 1, and 1 dimension went to zero — nullity 1.","text_assured":"Rank 1 plus nullity 1 equals 2, the input dimension — 'one direction survives, one direction dies' is exactly the theorem."}],"ghost":{"x_expr":"cos(t)","y_expr":"sin(t)"}}
```
