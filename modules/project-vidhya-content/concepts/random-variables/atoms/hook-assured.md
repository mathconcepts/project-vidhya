---
# Alternative body for random-variables.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: random-variables.hook.assured
concept_id: random-variables
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: random-variables.hook
for_stance: assured
---

$E[aX+b]=aE[X]+b$ holds unconditionally — no independence, no distributional assumption required — while $\text{Var}(aX+b)=a^2\text{Var}(X)$ drops the additive shift entirely and squares the multiplicative one, since variance measures spread and a shift moves everything together without stretching it. Confusing the two (squaring the shift, or forgetting to square $a$ for the variance) fails a problem that never even required knowing $X$'s actual distribution — both identities hold for every random variable with finite mean and variance, discrete or continuous.
