---
# Alternative body for integration-basics.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: integration-basics.intuition.assured
concept_id: integration-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: integration-basics.intuition
for_stance: assured
---

The power rule formula $\int x^n\,dx=\frac{x^{n+1}}{n+1}+C$ has an excluded case that costs marks by omission: $n=-1$ makes the denominator zero, and $\int x^{-1}\,dx=\ln|x|+C$ instead — a genuinely different antiderivative, not a limiting case of the power rule. The absolute value is not decorative: $\frac{d}{dx}\ln|x|=\frac1x$ for *both* $x>0$ and $x<0$, so dropping it silently loses the negative-$x$ branch of the domain.

The constant $C$ matters for an indefinite integral and an initial-value problem, but is irrelevant — not merely small — in a definite integral: $\int_a^b f(x)\,dx=[F(x)+C]_a^b=(F(b)+C)-(F(a)+C)=F(b)-F(a)$, and $C$ cancels identically regardless of its value. Carrying it through a definite-integral computation is harmless but wasted motion; omitting it from an indefinite integral or an IVP is a genuine error, since an initial condition pins down one specific value of $C$ that a bare antiderivative cannot supply.
