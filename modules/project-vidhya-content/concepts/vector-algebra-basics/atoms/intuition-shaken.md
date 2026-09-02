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

Take $\vec a=(1,0,0)$ and $\vec b=(0,1,0)$ — arrows along the $x$-axis and $y$-axis.

Step one, the dot product: $\vec a\cdot\vec b=(1)(0)+(0)(1)+(0)(0)=0$. Zero means perpendicular — these two arrows are exactly perpendicular, so the number matches the picture.

Step two, the cross product: $\vec a\times\vec b=(0\cdot0-0\cdot1,\ 0\cdot0-1\cdot0,\ 1\cdot1-0\cdot0)=(0,0,1)$. This new arrow points straight up, perpendicular to both — check with the right-hand rule: fingers from $\vec a$ toward $\vec b$, thumb points up. Its length is $1$, matching the area of the unit square $\vec a,\vec b$ span.

Step three, add a third arrow $\vec c=(0,0,1)$ and compute the triple product: $\vec a\cdot(\vec b\times\vec c)=\vec a\cdot(1,0,0)=1$. Nonzero, so the three arrows are not coplanar — they span a real box, the unit cube.

Check: dot product zero matched perpendicular; cross product length matched the square's area; triple product matched the cube's volume.
