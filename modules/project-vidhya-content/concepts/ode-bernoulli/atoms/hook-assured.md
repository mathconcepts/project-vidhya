---
# Alternative body for ode-bernoulli.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: ode-bernoulli.hook.assured
concept_id: ode-bernoulli
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: ode-bernoulli.hook
for_stance: assured
---

The nonlinearity lives entirely in the exponent $n$ on $y$. Confirm $n \neq 0, 1$ before reaching for $v = y^{1-n}$ — at $n = 0$ the equation is already linear, at $n = 1$ it's separable, and the substitution below is wasted effort on either.
