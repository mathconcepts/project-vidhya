---
# Alternative body for product-quotient-rule.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: product-quotient-rule.hook.assured
concept_id: product-quotient-rule
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: product-quotient-rule.hook
for_stance: assured
---

GATE's giveaway is "differentiate $\dfrac{u}{v}$" where $v$ is a genuine function, not a constant — and the fastest route often skips the quotient rule's larger denominator entirely: rewrite $\dfrac{u}{v}=u\cdot v^{-1}$ and apply the product rule with chain rule on $v^{-1}$, since $(v^{-1})'=-v^{-2}v'$. Reaching for the quotient rule on $u/c$ for a constant $c$ is the wasted-motion version of the same mistake in reverse — factor out $\frac1c$ and differentiate $u$ alone.
