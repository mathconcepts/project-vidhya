---
# Alternative body for vector-algebra-basics.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: vector-algebra-basics.intuition.shaken
concept_id: vector-algebra-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.10
exam_ids: ["*"]
scaffold_fade: true
variant_of: vector-algebra-basics.intuition
for_stance: shaken
---

Same two forces as the hook: $\vec a=(5,0,0)$ (5 N east) and $\vec b=(2.5,4.33,0)$ (5 N at 60°, split into its east and north parts).

Step one, the dot product: $\vec a\cdot\vec b=(5)(2.5)+(0)(4.33)+(0)(0)=12.5$. Not zero, so the forces are not perpendicular — matches the picture, since 60° is not 90°. This number is also just $|\vec a||\vec b|\cos60°=5\times5\times0.5=12.5$, the same law of cosines the hook already used to find the resultant.

Step two, the cross product: $\vec a\times\vec b=(0,0,21.65)$ — a new arrow, aimed directly out of the page, perpendicular to both forces. Its length, $21.65$, is the area of the parallelogram the two forces span; check with $|\vec a||\vec b|\sin60°=5\times5\times0.866=21.65$, the same number.

Step three: suppose a third force, $\vec c=(0,0,1)$ — 1 N lifting the ring vertically, off the plane the first two forces share. The triple product $\vec a\cdot(\vec b\times\vec c)=21.65$. Nonzero, so the three forces are not coplanar — one of them genuinely leaves the other two's plane, so together they'd pull the ring in a real 3-D way, not flatten it onto one sheet.

Check: dot product nonzero matched "not perpendicular"; cross product length matched the parallelogram's area; triple product matched "not lying in one plane."
