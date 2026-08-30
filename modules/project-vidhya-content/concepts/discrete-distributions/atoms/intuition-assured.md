---
# Alternative body for discrete-distributions.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: discrete-distributions.intuition.assured
concept_id: discrete-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: discrete-distributions.intuition
for_stance: assured
---

## The one axis that separates all four

Fixed trials, constant $p$, with replacement → binomial. No fixed trial count, a rate instead → Poisson. Waiting for a first success → geometric. Finite population, no replacement → hypergeometric. Three of the four assume trials don't change the odds; hypergeometric is the exception, and the one most often mis-modeled as binomial when a sample is drawn from a small finite pool.

## The convergence worth knowing cold

As $n\to\infty$ and $p\to0$ with $np=\lambda$ held fixed, Binomial$(n,p)\to$Poisson$(\lambda)$. Separately, as the population grows large relative to the sample, Hypergeometric $\to$ Binomial, since "without replacement" stops mattering once the pool barely shrinks per draw.

## Where marks are lost

Plugging hypergeometric $n$ and $p$ straight into the binomial PMF ignores that each draw changes the remaining composition — valid only in the large-population limit above, never as a default.
