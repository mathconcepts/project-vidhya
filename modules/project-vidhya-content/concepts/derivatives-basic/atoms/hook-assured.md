---
# Alternative body for derivatives-basic.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: derivatives-basic.hook.assured
concept_id: derivatives-basic
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: derivatives-basic.hook
for_stance: assured
---

GATE phrases this as "rate of change" or "instantaneous rate," and the tempting wrong answer is the average rate $\frac{f(b)-f(a)}{b-a}$ when the question asks for the derivative *at a point*. The average is a secant's slope across an interval; the derivative is a tangent's slope at one instant. The two coincide only in the limit as the interval shrinks to zero — never for a finite interval, however small it looks.
