---
# Alternative body for orthogonality.hook, served when the learner stance is
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
id: orthogonality.hook.shaken
concept_id: orthogonality
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: orthogonality.hook
for_stance: shaken
---

Two vectors are **orthogonal** when they meet at a right angle. The test: $u\cdot v = u_1v_1+u_2v_2$. Zero means perpendicular.

$(1,0)$ and $(0,1)$: $0$. Perpendicular — visibly.

$(1,1)$ and $(1,-1)$: $1-1=0$. Also perpendicular — the dot product told you without a drawing.

```interactive-spec
{"v":1,"kind":"simulation","title":"Two orthogonal frequencies: cos(t) against cos(2t)","x_expr":"cos(t)","y_expr":"cos(2*t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-1.3,"x_max":1.3,"y_min":-1.3,"y_max":1.3},"caption":"Watch the dot trace a looping curve instead of a circle — cos(t) and cos(2t) are orthogonal functions, the same zero-overlap idea as two perpendicular vectors."}
```
