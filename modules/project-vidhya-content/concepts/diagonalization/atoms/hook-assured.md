---
# Alternative body for diagonalization.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: diagonalization.hook.assured
concept_id: diagonalization
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: diagonalization.hook
for_stance: assured
---

Diagonalization writes $A = PDP^{-1}$: the same map, seen in the eigenvector basis, where it is pure scaling. Everything downstream — fast powers, matrix exponentials, decoupled systems — is this one substitution paying rent.

It fails exactly when some eigenvalue's geometric multiplicity falls short of its algebraic one. What's the smallest matrix where that happens?
