---
# Alternative body for change-of-basis.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: change-of-basis.intuition.shaken
concept_id: change-of-basis
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: change-of-basis.intuition
for_stance: shaken
---

Picture a point on the floor, $(3, 1)$ against the room's ordinary $x$-$y$ grid.

Now tilt your head $45°$. The point hasn't moved. But read its coordinates off your tilted view and you get different numbers — about $(2.83, 1.41)$.

One point. Two number-pairs. The change-of-basis matrix $P$ is the translator: feed it coordinates in one basis, it hands back coordinates in the other.

Check it: run $P^{-1}$ on $(2.83, 1.41)$ and you land back on $(3, 1)$.
