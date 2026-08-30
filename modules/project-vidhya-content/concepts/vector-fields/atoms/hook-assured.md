---
# Alternative body for vector-fields.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: vector-fields.hook.assured
concept_id: vector-fields
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: vector-fields.hook
for_stance: assured
---

$\nabla\times\mathbf F=\mathbf 0$ is only equivalent to conservative on a simply connected domain — a region with no holes to route a loop around. Punch a single hole out of the plane and the equivalence breaks: a field can be irrotational everywhere on the punctured plane and still have nonzero circulation around a loop encircling the hole. Confirming curl is zero at every point of $\mathbf F$'s domain is necessary but not sufficient; the shape of the domain itself is part of the hypothesis, not a footnote.
