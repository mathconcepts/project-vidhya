---
# Alternative body for product-quotient-rule.intuition, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: product-quotient-rule.intuition.assured
concept_id: product-quotient-rule
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: product-quotient-rule-intuition
for_stance: assured
---

Logarithmic differentiation collapses a chain of products and quotients that would otherwise need repeated rule application: for $f=\dfrac{u\,v}{w}$, take $\ln|f|=\ln|u|+\ln|v|-\ln|w|$, differentiate both sides, $\dfrac{f'}{f}=\dfrac{u'}{u}+\dfrac{v'}{v}-\dfrac{w'}{w}$, then multiply back through by $f$ — one differentiation pass regardless of how many factors are chained together, instead of nesting the product and quotient rules.

This only works when $f\neq0$ on the interval, and the absolute value is load-bearing, not decoration — $\ln f$ alone is undefined wherever $f<0$, even though $\dfrac{d}{dx}\ln|f|=\dfrac{f'}{f}$ holds on both sides of a sign change.

The three-factor product rule, $(uvw)'=u'vw+uv'w+uvw'$, is symmetric — each factor gets exactly one term where it alone is differentiated — and this generalizes to $n$ factors the same way, a fact the "apply the rule twice" framing obscures by treating it as sequential rather than a single symmetric sum.
