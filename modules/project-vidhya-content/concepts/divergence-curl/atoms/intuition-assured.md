---
# Alternative body for divergence-curl.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: divergence-curl.intuition.assured
concept_id: divergence-curl
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: divergence-curl-intuition
for_stance: assured
---

Div-of-curl and curl-of-grad vanish identically for any smooth field, but curl-of-curl does not: $\nabla\times(\nabla\times\mathbf F)=\nabla(\nabla\cdot\mathbf F)-\nabla^2\mathbf F$, a genuinely new vector, zero only when $\mathbf F$ happens to be both solenoidal and componentwise harmonic. Treating all three second-order compositions as automatically zero is the fast way to lose an identity-recall mark. The other recurring trap: $\nabla\cdot\mathbf F=0$ and $\nabla\times\mathbf F=\mathbf 0$ are independent conditions — a rotational field can still be incompressible, e.g. rigid rotation $\mathbf F=(-y,x,0)$ has divergence $0$ and curl $2\hat k$ — so neither property can be inferred from the other. Compute both explicitly rather than assuming one from the other's value.
