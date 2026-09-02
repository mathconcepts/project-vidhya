---
# Alternative body for improper-integrals.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: improper-integrals.intuition.assured
concept_id: improper-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
variant_of: improper-integrals.intuition
for_stance: assured
---

The one number worth memorizing carefully is $p=1$, because the test's DIRECTION flips depending on where the trouble sits. At infinity ($\int_1^\infty x^{-p}dx$), convergence needs $p>1$ — decay steep enough to outrun the growing width. At an interior or endpoint singularity ($\int_0^1 x^{-p}dx$), convergence needs the OPPOSITE, $p<1$ — a mild enough blow-up that the shrinking width still wins. Applying the infinity-side rule to a point-singularity, or vice versa, is the single most common misclassification here, since both look like "check $p$ against $1$" from a distance and only the direction differs.
