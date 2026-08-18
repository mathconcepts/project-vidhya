---
# Alternative body for gram-schmidt.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: gram-schmidt.intuition.assured
concept_id: gram-schmidt
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: gram-schmidt.intuition
for_stance: assured
---

Each step is a projection-and-subtract: $\tilde u_k = v_k - \sum_{i<k}\langle v_k,e_i\rangle e_i$, then normalize. The sum removes every component already accounted for by the earlier orthonormal vectors, so $\tilde u_k$ is automatically orthogonal to all of $e_1,\dots,e_{k-1}$ — that's not a separate fact to verify, it's forced by the subtraction.

**What actually varies:** the input order. Different orderings of the same independent set produce different (but equally valid) orthonormal bases spanning the same subspace — a common false assumption is that Gram-Schmidt has a unique output.

**Where it shows up beyond the algorithm itself:** QR decomposition is exactly this process recorded as matrices ($Q$ = the orthonormal vectors, $R$ = the projection coefficients), and least-squares projections reuse the same inner-product subtraction.
