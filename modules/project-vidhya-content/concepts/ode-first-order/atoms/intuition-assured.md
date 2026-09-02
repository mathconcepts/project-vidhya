---
# Alternative body for ode-first-order-intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced block below is copied verbatim from the base atom so the
# decision tree cannot drift between variants; only surrounding prose
# differs.
id: ode-first-order.intuition.assured
concept_id: ode-first-order
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: ode-first-order-intuition
for_stance: assured
---

Run the cheap tests in order: separable (right side factors as $g(x)h(y)$), linear ($y,y'$ appear only to the first power, right side depends on $x$ alone), exact ($\partial M/\partial y=\partial N/\partial x$). An equation that's both separable and linear, like $y'=ky$, should be solved as separable — it skips computing an integrating factor entirely.

```
Is dy/dx = g(x)·h(y)?      → Separable
Is it dy/dx + P(x)y = Q(x)?  → Linear (integrating factor)
Is ∂M/∂y = ∂N/∂x?           → Exact
Otherwise                    → Check for Bernoulli or substitution
```

The claim that sounds right but isn't: "linear in $y$" does not mean "no $x$ and $y$ appearing together." $y'+xy=x$ is linear even though $xy$ shows up, since $y$ itself is still first power throughout. What actually breaks linearity is $y$ raised to a power, or $y$ passed through something like $\sin$, $\log$ or $e^{(\cdot)}$ — never a coefficient that merely depends on $x$.
