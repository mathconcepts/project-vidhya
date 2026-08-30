---
# Alternative body for ode-higher-order-intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: ode-higher-order.intuition.assured
concept_id: ode-higher-order
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: ode-higher-order-intuition
for_stance: assured
---

The false generalisation that costs marks: a root repeated $m$ times does **not** just multiply its coefficient, it forces $m$ distinct basis functions, $e^{rx},xe^{rx},\ldots,x^{m-1}e^{rx}$. $c_1e^{2x}+c_2e^{2x}$ is one function wearing two names, not two independent solutions — the extra factor of $x$ is what actually buys independence, and reduction of order is the reason it's a genuine solution rather than a guess.

Complex roots come in conjugate pairs by construction (real coefficients), so $\alpha\pm i\beta$ always contributes the real pair $e^{\alpha x}\cos\beta x$, $e^{\alpha x}\sin\beta x$ together — never one without the other, and never the complex exponentials themselves in a real-valued answer.

Before writing the final $y$, count basis functions against the equation's order: an $n$th-order equation that produces fewer than $n$ independent solutions has a root-finding error upstream, not a legitimately smaller answer.
