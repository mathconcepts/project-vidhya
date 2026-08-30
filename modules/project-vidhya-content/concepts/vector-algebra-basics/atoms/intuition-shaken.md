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
difficulty: 0.15
exam_ids: ["*"]
scaffold_fade: true
variant_of: vector-algebra-basics.intuition
for_stance: shaken
---

Take $\vec a=3\hat i,\ \vec b=4\hat j,\ \vec c=5\hat k$ — three vectors along the axes, forming an ordinary $3\times4\times5$ box.

Dot product: $\vec a\cdot\vec b=(3)(0)+(0)(4)+(0)(0)=0$. Perpendicular, as expected for two edges of a box meeting at a corner.

Cross product: $\vec a\times\vec b=(0,0,12)$, magnitude $12$, exactly the area of the $3\times4$ face the two vectors span.

Scalar triple product: $\vec b\times\vec c=(20,0,0)$, then $\vec a\cdot(\vec b\times\vec c)=(3)(20)=60$, exactly the volume of the box, $3\times4\times5=60$.

Tilt any one of the three away from its axis and every number changes, but the pattern does not: dot product answers how aligned, cross product answers how much area, and the triple product answers how much volume — three different questions about the same three arrows.
