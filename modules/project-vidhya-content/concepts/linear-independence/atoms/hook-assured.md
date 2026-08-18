---
# Alternative body for linear-independence.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: linear-independence.hook.assured
concept_id: linear-independence
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: linear-independence.hook
for_stance: assured
---

$\{v_1,\ldots,v_k\}$ is independent iff $c_1v_1+\cdots+c_kv_k=0$ forces every $c_i=0$ — the only way to zero-combine them is trivially. Dependence means one vector is redundant: expressible as a combination of the rest. Only an independent set can be extended to, or trimmed down to, a basis.
