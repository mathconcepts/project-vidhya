---
# Alternative body for inverse-laplace.hook, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: inverse-laplace.hook.assured
concept_id: inverse-laplace
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: inverse-laplace.hook
for_stance: assured
---

The trip home is table-lookup, not the Bromwich integral — nobody evaluates that contour on an exam. The place a confident answer still goes wrong is a repeated pole: $\dfrac{1}{(s+a)^2}$ inverts to $te^{-at}$, not $e^{-at}$ again, and skipping the Heaviside expansion for it produces a plausible-looking wrong function rather than an obviously broken one.
