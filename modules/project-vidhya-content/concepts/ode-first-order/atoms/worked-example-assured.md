---
# Alternative body for ode-first-order-worked-example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: ode-first-order.worked-example.assured
concept_id: ode-first-order
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: ode-first-order-worked-example
for_stance: assured
---

## $\dfrac{dy}{dx}+2y=e^{-x}$: confirm the form, then the algebra is routine

Already standard: $P=2$, $Q=e^{-x}$. Confirm the sign of $P$ before computing $\mu$ — the real failure mode is applying $e^{\int P\,dx}$ to an equation still needing rearrangement (e.g. $y'-3y=x^2$ has $P=-3$, not $3$), not the integration that follows.

$\mu=e^{2x}$ needs no constant — it cancels in the final quotient regardless of what's chosen. Multiplying through collapses the left side to $\dfrac{d}{dx}(e^{2x}y)$, and integrating gives

$$\boxed{y(x)=e^{-x}+Ce^{-2x}}$$

With $y(0)=2$: $1+C=2$, so $C=1$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving dy/dx + 2y = e⁻ˣ by integrating factor","steps":[{"prompt":"Identify $P(x)$ and $Q(x)$ for the ODE $\\\\dfrac{dy}{dx} - 3y = x^2$.","hint":"Rewrite in standard form $\\\\dfrac{dy}{dx} + P(x)y = Q(x)$ and read off the coefficients.","answer":"$P(x) = -3$ and $Q(x) = x^2$. (Note the sign: the equation has $-3y$, so $P = -3$, not $+3$.)"},{"prompt":"For $\\\\dfrac{dy}{dx} + 2y = e^{-x}$, what is the integrating factor $\\\\mu(x)$?","hint":"Compute $e^{\\\\int P(x)\\\\,dx}$ where $P(x) = 2$.","answer":"$\\\\mu(x) = e^{\\\\int 2\\\\,dx} = e^{2x}$."},{"prompt":"After multiplying by $\\\\mu = e^{2x}$, the left side becomes $\\\\dfrac{d}{dx}(e^{2x}y)$. Integrate both sides and solve for $y$.","hint":"The right side is $e^{2x}\\\\cdot e^{-x} = e^x$. Integrate $e^x$ to get $e^x + C$.","answer":"$e^{2x}y = e^x + C$, so $y = e^{-x} + Ce^{-2x}$."}]}
```
