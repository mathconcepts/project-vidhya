---
# Alternative body for matrix-inverse.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: matrix-inverse.hook.assured
concept_id: matrix-inverse
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: matrix-inverse.hook
for_stance: assured
---

$A^{-1}$ undoes $A$: $AA^{-1} = A^{-1}A = I$. Exists iff $\det(A) \neq 0$ — a zero determinant means $A$ collapses space onto a lower dimension, and nothing can un-collapse it. $(AB)^{-1} = B^{-1}A^{-1}$: order reverses, same pattern as transpose.
