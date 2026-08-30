---
# Alternative body for sets-relations.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: sets-relations.intuition.assured
concept_id: sets-relations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["gate-ma"]
scaffold_fade: 0
variant_of: sets-relations-intuition
for_stance: assured
---

Equivalence relation and partial order share two of three properties, reflexive and transitive, and split only on the third: symmetric for equivalence, antisymmetric for partial order. A relation with both symmetric and antisymmetric collapses to equality, since $aRb\land bRa\Rightarrow a=b$ forces every related pair to already be equal.

Union and intersection cardinality: $|A\cup B|=|A|+|B|-|A\cap B|$ double-counts the intersection once and removes it once — for three sets, the pairwise-intersection terms get removed and the triple intersection needs restoring, since it was subtracted three times over by those pairwise terms and needs adding back exactly once.

Equivalence classes partition a set completely: every element sits in exactly one class, never zero, never two, which is what licenses treating $[a]=[b]$ as a single object rather than comparing every element of both classes pairwise. A partial order gives no such partition — incomparable elements simply have no relation either way, not membership in different classes.
