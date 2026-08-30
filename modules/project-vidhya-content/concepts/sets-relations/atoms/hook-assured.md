---
# Alternative body for sets-relations.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: sets-relations.hook.assured
concept_id: sets-relations
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: sets-relations.hook
for_stance: assured
---

One axiom is all that separates equivalence relation from partial order — both need reflexive and transitive, and split only on symmetric versus antisymmetric. A relation satisfying both symmetric and antisymmetric at once collapses to equality, since $aRb$ and $bRa$ together with antisymmetry force $a=b$ — so anything that is both an equivalence relation and a partial order has every class of size one. Naming the wrong one of the two properties is the fastest way a confident answer gets a classification backwards.
