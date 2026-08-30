---
# Alternative body for implicit-differentiation.hook, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: implicit-differentiation.hook.assured
concept_id: implicit-differentiation
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: implicit-differentiation.hook
for_stance: assured
---

GATE's giveaway phrase is "find $dy/dx$" with $x$ and $y$ mixed together, not solved for $y$. The error that costs the mark: differentiating a $y$-term as if $y$ were an ordinary variable in $x$ — writing $\frac{d}{dx}[y^2]=2y$ instead of $2y\cdot\frac{dy}{dx}$, dropping the chain-rule factor implicit differentiation exists to supply. Any term containing $y$ carries that hidden factor; only terms in $x$ alone do not.
