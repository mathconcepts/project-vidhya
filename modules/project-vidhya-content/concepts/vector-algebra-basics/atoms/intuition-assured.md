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
difficulty: 0.10
exam_ids: ["*"]
scaffold_fade: true
variant_of: vector-algebra-basics.intuition
for_stance: assured
---

A sharper check than most students reach for: $\vec a\times\vec b=\vec 0$ only tests whether $\vec a$ and $\vec b$ are parallel to **each other**. It says nothing about a third vector $\vec c$ — checking whether $\vec c$ lies in the plane spanned by $\vec a,\vec b$ needs the scalar triple product, $\vec a\cdot(\vec b\times\vec c)=0$, not a second cross product. GATE MSQs exploit exactly this: three vectors are given, two of them parallel, and the question asks whether all three are coplanar — computing only $\vec a\times\vec b$ answers a different question than the one asked. Coplanarity of three vectors is a volume-zero statement, not a direction-zero statement, and volume needs all three vectors inside one product.
