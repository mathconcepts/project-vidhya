---
# Alternative body for ode-first-order-intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced block below is copied verbatim from the base atom so the
# decision tree cannot drift between variants; only surrounding prose
# differs.
id: ode-first-order.intuition.shaken
concept_id: ode-first-order
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: ode-first-order-intuition
for_stance: shaken
---

## Three types, one small example each

**Separable.** $\dfrac{dy}{dx}=xy$: the right side is $x$ times $y$ — two separate factors. Divide by $y$: $\dfrac{dy}{y}=x\,dx$, then integrate both sides.

**Linear.** $\dfrac{dy}{dx}+2y=e^{-x}$: $y$ and $y'$ each appear to the first power only, and the right side depends on $x$ alone. Multiply by the integrating factor $\mu=e^{2x}$ and the left side collapses to $\dfrac{d}{dx}(\mu y)$.

**Exact.** $y\,dx+x\,dy=0$: here $M=y$, $N=x$. Check $\dfrac{\partial M}{\partial y}=1$ against $\dfrac{\partial N}{\partial x}=1$ — they match, so a function $F=xy$ gives the solution $xy=C$.

## Classify before doing anything else

```
Is dy/dx = g(x)·h(y)?      → Separable
Is it dy/dx + P(x)y = Q(x)?  → Linear (integrating factor)
Is ∂M/∂y = ∂N/∂x?           → Exact
Otherwise                    → Check for Bernoulli or substitution
```

The general solution keeps an arbitrary constant; a particular solution pins that constant down using one given point $(x_0,y_0)$. Find the general one first, then plug the point in.
