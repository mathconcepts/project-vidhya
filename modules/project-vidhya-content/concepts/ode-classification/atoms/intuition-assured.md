---
# Alternative body for ode-classification.intuition, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the one distinction that costs marks
# rather than re-teaching what they can already do.
id: ode-classification.intuition.assured
concept_id: ode-classification
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: ode-classification.intuition
for_stance: assured
---

The useful fact under time pressure: order equals the number of independent constants the general solution carries, which equals the number of conditions the problem must supply — an order-$2$ equation always needs two, never one clever combination standing in for both. Degree carries no such physical meaning; it's purely how the equation is written, and it is **undefined** — not $1$ — whenever a derivative can't be cleared into a whole-number power (trapped under a root, a denominator with another derivative, or inside $\sin$, $\log$, $e^{(\cdot)}$).

The trap that actually costs marks: assuming linearity hinges only on the highest-order derivative. It doesn't. $y'' + y\,y' = 0$ has $y''$ appearing to the first power, which tempts a "linear" verdict — but the product $y\,y'$ alone makes the whole equation non-linear, regardless of every other term's good behaviour. Check every term, not just the leading one.
