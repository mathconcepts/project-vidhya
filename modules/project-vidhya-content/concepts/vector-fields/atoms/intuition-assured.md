---
# Alternative body for vector-fields.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: vector-fields.intuition.assured
concept_id: vector-fields
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: vector-fields-intuition
for_stance: assured
---

A single closed loop with $\oint_C\mathbf F\cdot d\mathbf r\ne0$ instantly disproves conservativeness — one counterexample is enough. But no finite number of loops evaluating to $0$ can prove it, since infinitely many loops exist; the only route to a proof is the curl test on a simply connected domain, or exhibiting $\phi$ explicitly. $\phi$ itself is never unique — any $\phi+C$ works, since $\nabla C=\mathbf 0$ — which is why the additive constant is irrelevant to $\phi(B)-\phi(A)$ and shows up in the general antiderivative step as a genuine degree of freedom, not an error to resolve.
