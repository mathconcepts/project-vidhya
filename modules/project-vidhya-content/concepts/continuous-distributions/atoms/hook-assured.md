---
# Alternative body for continuous-distributions.hook, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: continuous-distributions.hook.assured
concept_id: continuous-distributions
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: continuous-distributions.hook
for_stance: assured
---

Every "find $P(X=c)$" question in this topic has the same one-line answer: zero, always, for any continuous $X$ at any single point — density integrates to a positive number only over a width. Confusing $f(x)$ (a density, which can exceed 1) with $P(a<X<b)$ (always in $[0,1]$) is the fastest way to lose marks. The reflex worth having: standardize immediately, read the table, and never sanity-check a density value against $[0,1]$ — only probabilities live there.
