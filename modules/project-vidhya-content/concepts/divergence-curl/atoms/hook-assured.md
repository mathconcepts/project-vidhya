---
# Alternative body for divergence-curl.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: divergence-curl.hook.assured
concept_id: divergence-curl
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: divergence-curl.hook
for_stance: assured
---

Two independent properties get run together under pressure: $\nabla\cdot\mathbf F=0$ (solenoidal) says nothing about $\nabla\times\mathbf F=0$ (irrotational), and neither implies the other. $\mathbf F=(-y,x,0)$ is solenoidal — $\nabla\cdot\mathbf F=0$ — yet has curl $2\hat k$ everywhere. $\mathbf F=(x,y,0)$ is irrotational — curl $0$ — yet has divergence $2$. A field can be neither, either, or both; exam options exploit exactly this independence.
