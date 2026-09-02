---
# Alternative body for multiple-integrals.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: multiple-integrals.worked_example.assured
concept_id: multiple-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
scaffold_fade: true
variant_of: multiple-integrals.worked_example
for_stance: assured
---

Swapping the order isn't only a verification tool — sometimes ONE order is genuinely easier and picking it in advance saves the whole computation. Here both orders happen to be equally short since the region is a rectangle and the integrand factors as $x\cdot y$; but for a region where the outer bound is a complicated function of the inner variable in one order and a constant in the other, choosing the order with constant outer bounds up front — rather than discovering the mess partway through — is the real time-saver on a timed paper, not merely a sanity check performed after the fact.

$$
\boxed{\int_0^1\!\!\int_0^2 xy\,dy\,dx=1}
$$
