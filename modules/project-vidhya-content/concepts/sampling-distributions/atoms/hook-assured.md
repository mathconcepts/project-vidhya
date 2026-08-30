---
# Alternative body for sampling-distributions.hook, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: sampling-distributions.hook.assured
concept_id: sampling-distributions
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: sampling-distributions.hook
for_stance: assured
---

The Central Limit Theorem says the sampling distribution of $\bar{X}$ trends normal as $n$ grows — regardless of the population's shape — with standard error $\sigma/\sqrt{n}$; that's a statement about $\bar{X}$'s distribution, not a claim the population itself becomes normal. Swap in sample $s$ for an unknown $\sigma$ and the extra estimation uncertainty means $T=(\bar{X}-\mu)/(s/\sqrt{n})$ follows Student's $t_{n-1}$, not $Z$ — fatter tails, correctly wider intervals, converging to normal only once $n$ is large enough that $s\approx\sigma$.
