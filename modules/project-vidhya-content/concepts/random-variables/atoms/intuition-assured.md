---
# Alternative body for random-variables-intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `random-variables-intuition` (no dot), a
# legacy naming drift check-content-integrity.ts tolerates. variant_of
# points at that exact id; this file's own id follows the normal convention
# instead of propagating the drift.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: random-variables.intuition.assured
concept_id: random-variables
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: random-variables-intuition
for_stance: assured
---

## The two computing tools, always available

$E[X]$: weighted average, discrete sum or continuous integral. $\text{Var}(X)=E[X^2]-(E[X])^2$ — the second-moment form, almost always faster than expanding $(X-E[X])^2$ directly.

## The linearity that survives everything

$E[aX+b]=aE[X]+b$ needs no independence assumption — it holds for ANY random variable, correlated with anything or not. $\text{Var}(aX+b)=a^2\text{Var}(X)$ drops $b$ (a shift doesn't change spread) and squares $a$ (scaling stretches spread quadratically, since variance is itself a squared quantity).

## The convergence and the exception worth having cold

$B(n,p)\to\text{Po}(np)$ as $n\to\infty,\,p\to0$ with $np$ fixed. Separately, geometric is the ONLY discrete distribution that's memoryless: $P(X>m+n\mid X>m)=P(X>n)$ — past failures carry zero information about future ones.
