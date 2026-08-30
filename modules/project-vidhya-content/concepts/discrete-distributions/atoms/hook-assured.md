---
# Alternative body for discrete-distributions.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: discrete-distributions.hook.assured
concept_id: discrete-distributions
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: discrete-distributions.hook
for_stance: assured
---

Binomial needs a FIXED number of trials $n$ known in advance; Poisson counts events in a fixed window with no cap on how many could occur. Mistaking one for the other sets up the wrong PMF: "defects per 100 items" is binomial ($n=100$ fixed), "defects per hour of production" is Poisson. Geometric and hypergeometric split on a second axis entirely — replacement. Waiting for the first success under replacement is geometric; drawing without replacement from an already-fixed finite pool is hypergeometric. The story, not the numbers, decides the formula.
