---
# Alternative body for vector-algebra-basics.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: vector-algebra-basics.hook.assured
concept_id: vector-algebra-basics
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: vector-algebra-basics.hook
for_stance: assured
---

Two vectors of equal magnitude never combine to more than twice that magnitude, and only reach that ceiling when they point the same way — governed by $|\vec a+\vec b|^2=|\vec a|^2+|\vec b|^2+2\vec a\cdot\vec b$. The distinction worth marks: $\vec a\cdot\vec b=0$ tests **perpendicularity**, but $\vec a\times\vec b=\vec 0$ tests **parallelism** — they are not two routes to the same fact, and GATE options routinely swap one condition for the other to catch a guess.
