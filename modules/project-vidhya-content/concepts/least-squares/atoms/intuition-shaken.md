---
# Alternative body for least-squares.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
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
