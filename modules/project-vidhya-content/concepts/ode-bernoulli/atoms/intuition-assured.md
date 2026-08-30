---
# Alternative body for ode-bernoulli-intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: ode-bernoulli.intuition.assured
concept_id: ode-bernoulli
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: ode-bernoulli-intuition
for_stance: assured
---

The method is one substitution: $v = y^{1-n}$, chosen precisely because $\dfrac{dv}{dx} = (1-n)y^{-n}\dfrac{dy}{dx}$ matches what's left after dividing the original equation by $y^n$. Solving the resulting linear equation $v' + (1-n)Pv = (1-n)Q$ by integrating factor is the entire remaining task.

**The edge case worth stating outright.** $n=0$ and $n=1$ are not degenerate corner cases of the Bernoulli method — they're what makes an equation Bernoulli in the first place. At those values the equation is *already* linear or separable, and running the substitution machinery on it only adds algebra.

**The condition worth stating on the answer line.** Dividing by $y^n$ silently discards $y \equiv 0$ whenever $n > 0$, since $y=0$ also solves the original equation but vanishes on division. Name it rather than let it disappear unremarked.
