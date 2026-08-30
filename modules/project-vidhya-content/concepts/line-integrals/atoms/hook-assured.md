---
# Alternative body for line-integrals.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: line-integrals.hook.assured
concept_id: line-integrals
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: line-integrals.hook
for_stance: assured
---

Reverse the direction of travel along the same curve and $\int_C\mathbf F\cdot d\mathbf r$ flips sign, but $\int_C f\,ds$ does not — $ds>0$ regardless of direction, while $d\mathbf r$ does. Treating both integral types as equally orientation-sensitive is the fast way to drop a sign on the vector one, or add a phantom sign to the scalar one. Path-independence for $\int_C\mathbf F\cdot d\mathbf r$ also needs $\mathbf F$ conservative — check $\nabla\times\mathbf F=\mathbf 0$ first; assuming it without checking is the second common failure.
