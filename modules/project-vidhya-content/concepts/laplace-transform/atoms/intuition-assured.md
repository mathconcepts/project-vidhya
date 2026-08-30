---
# Alternative body for laplace-transform.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: laplace-transform-intuition.assured
concept_id: laplace-transform
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: laplace-transform-intuition
for_stance: assured
---

Lead with the region, not the domain-swap story: a transform quoted without $\text{Re}(s)>\alpha$ is genuinely unfinished, since $\dfrac{1}{s-a}$ names two different signals depending on which side of the pole the ROC sits — identical algebra, different answer.

Keep the two derivative rules apart under pressure: $\mathcal L\{f'(t)\}=sF(s)-f(0)$ is the transform *of* a derivative; $\mathcal L\{tf(t)\}=-F'(s)$ is the derivative *of* a transform. They look superficially alike — both touch $s$, both carry a sign — and answer different questions; swapping them reads as an arithmetic slip but is a conceptual one.

The final-value theorem, $\lim_{s\to0}sF(s)$, is valid only when every pole of $sF(s)$ lies in the open left half-plane. A pole on the imaginary axis or in the right half-plane means the limit does not exist — the formula still hands back a number, and that number is wrong. Check pole locations first.

Cover-up for simple poles does not extend to repeated ones: $(s-a)^2$ needs both $A/(s-a)^2$ and $B/(s-a)$, and $B$ comes from differentiating, not from a second substitution.
