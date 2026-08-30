---
# Alternative body for line-integrals.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: line-integrals.intuition.assured
concept_id: line-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: line-integrals.intuition
for_stance: assured
---

$\nabla\times\mathbf F=\mathbf 0$ tells you circulation around any closed loop inside a simply connected piece of the domain is zero; it does not by itself hand you the antiderivative $\phi$ with $\mathbf F=\nabla\phi$ if the domain has a hole the loop could wrap around. Constructing $\phi$ explicitly — integrate one component, then differentiate to fix the leftover function of the other variable — is the step that actually proves conservativeness on the given domain, rather than being merely necessary for it. Once $\phi$ exists, $\int_C\mathbf F\cdot d\mathbf r=\phi(\text{end})-\phi(\text{start})$ regardless of the route, and a closed loop gives exactly $0$ — the fast answer, once $\phi$ is confirmed to exist rather than assumed.
