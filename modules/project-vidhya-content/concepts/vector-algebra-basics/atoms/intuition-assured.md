---
# Alternative body for vector-algebra-basics.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: vector-algebra-basics.intuition.assured
concept_id: vector-algebra-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
scaffold_fade: true
variant_of: vector-algebra-basics.intuition
for_stance: assured
---

$\vec a\times\vec b=-(\vec b\times\vec a)$: order matters, and swapping it flips the sign but not the magnitude — the parallelogram's area does not care which vector comes first, but the direction of the resulting normal does, and that direction feeds directly into any later triple product or torque calculation. For the triple product $[\vec a\,\vec b\,\vec c]$, only whether it equals $0$ signals coplanarity; its sign separately reports orientation, right-handed if positive, left-handed if negative, and carries no information about how flat or spread out the three vectors are. Reading a negative triple product as less coplanar than a positive one of the same magnitude is treating a handedness label as a magnitude.
