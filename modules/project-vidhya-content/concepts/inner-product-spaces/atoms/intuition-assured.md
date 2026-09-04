---
# Alternative body for inner-product-spaces.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: inner-product-spaces.intuition.assured
concept_id: inner-product-spaces
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: inner-product-spaces.intuition
for_stance: assured
---

Three axioms — bilinearity (linear in each slot separately), symmetry (conjugate symmetry over $\mathbb{C}$), positive-definiteness — are the whole contract. Anything satisfying them earns a norm $\|v\|=\sqrt{\langle v,v\rangle}$, an angle $\cos\theta = \frac{\langle u,v\rangle}{\|u\|\|v\|}$, and orthogonality "for free," regardless of what the vectors actually are. Check it against the hook's own numbers: $u=(1,2)$, $v=(3,1)$, $\langle u,v\rangle=5$, giving $\cos\theta=1/\sqrt2$ — a $45°$ angle, not a coincidence of the formula.

**Where this pays off on GATE.** The standard dot product is one instance, not the definition — expect $\langle A,B\rangle = \operatorname{tr}(A^TB)$ on matrix spaces or $\langle f,g\rangle=\int_a^b fg\,dx$ on function spaces. The mechanics don't change; only the multiply-and-sum becomes an integral or a trace.

**The check that costs the least.** Cauchy–Schwarz, $|\langle u,v\rangle|\le \|u\|\|v\|$, holds in *every* inner product space — use it to sanity-check a computed inner product before trusting it.
