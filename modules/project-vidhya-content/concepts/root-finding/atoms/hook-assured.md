---
# Alternative body for root-finding.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: root-finding.hook.assured
concept_id: root-finding
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: root-finding.hook
for_stance: assured
---

Every root-finding method here trades away a guarantee for speed, and GATE tests exactly that trade. Bisection converges whenever $f(a)f(b)<0$, at a fixed linear rate, using only the sign of $f$ — slow, but it cannot fail. Newton-Raphson converges quadratically near a *simple* root with $f'$ bounded away from zero, but a repeated root, a poor starting guess, or a near-zero $f'$ can make it stall, oscillate, or diverge outright. The secant method needs no derivative but only reaches superlinear order ($\approx1.618$), and it needs two starting values, not one. Knowing which guarantee a question is quietly assuming is worth more marks than reciting any single formula.
