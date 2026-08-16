---
# Alternative body for determinants.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: determinants.hook.shaken
concept_id: determinants
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: determinants.hook
for_stance: shaken
---

Take the unit square — corners at $(0,0)$, $(1,0)$, $(0,1)$, $(1,1)$. Area $1$.

Apply a matrix to all four corners. The square becomes a parallelogram. Measure its area.

That number is the **determinant**.

- Area came out $3$? The matrix triples areas. $\det = 3$.
- The parallelogram came out flipped over, mirror-image? Then $\det$ is negative.
- The square collapsed onto a line, area $0$? Then $\det = 0$ — and that is the case that matters most, because a flattened shape cannot be un-flattened. That is precisely what "not invertible" means.

Before any formula: the determinant is an **area scale factor with a sign**.

```interactive-spec
{"v":1,"kind":"simulation","title":"det([[3,0],[0,2]]) = 6: the unit circle's area grows 6x","x_expr":"3*cos(t)","y_expr":"2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-3.2,"x_max":3.2,"y_min":-3.2,"y_max":3.2},"caption":"Watch the traced curve — it's the unit circle stretched by A, enclosing exactly 6x the original area, matching det(A) = 6."}
```
