---
# Alternative body for least-squares.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: least-squares.intuition.shaken
concept_id: least-squares
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: least-squares.intuition
for_stance: shaken
---

A point floats above a flat plane. You can't land exactly on the plane, so drop a perpendicular line down to it — that's the closest point.

Least squares does the same thing with $b$ and $\text{Col}(A)$: it finds the point in $\text{Col}(A)$ closest to $b$, by dropping a perpendicular.

The check: whatever is "left over" — the residual $r = b - A\hat x$ — must be perpendicular to every column of $A$. If it isn't, $\hat x$ isn't the closest point.
