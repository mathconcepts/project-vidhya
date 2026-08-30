---
# Alternative body for ode-first-order-worked-example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: ode-first-order.worked-example.shaken
concept_id: ode-first-order
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: ode-first-order-worked-example
for_stance: shaken
---

## Solve $\dfrac{dy}{dx}+2y=e^{-x}$

**Classify.** $P(x)=2$, $Q(x)=e^{-x}$ — already in the standard linear form $y'+Py=Q$.

**Solve.** Integrating factor $\mu=e^{\int 2\,dx}=e^{2x}$. Multiply through: $e^{2x}y'+2e^{2x}y=e^{2x}e^{-x}=e^{x}$, and the left side is now $\dfrac{d}{dx}(e^{2x}y)$. Integrate both sides: $e^{2x}y=e^{x}+C$, so

$$\boxed{y(x)=e^{-x}+Ce^{-2x}}$$

**Check.** $y'=-e^{-x}-2Ce^{-2x}$, so $y'+2y=(-e^{-x}-2Ce^{-2x})+2(e^{-x}+Ce^{-2x})=e^{-x}$. That matches the original right side.

If $y(0)=2$: $1+C=2$, so $C=1$ and $y=e^{-x}+e^{-2x}$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving dy/dx + 2y = e⁻ˣ by integrating factor","steps":[{"prompt":"Identify $P(x)$ and $Q(x)$ for the ODE $\\\\dfrac{dy}{dx} - 3y = x^2$.","hint":"Rewrite in standard form $\\\\dfrac{dy}{dx} + P(x)y = Q(x)$ and read off the coefficients.","answer":"$P(x) = -3$ and $Q(x) = x^2$. (Note the sign: the equation has $-3y$, so $P = -3$, not $+3$.)"},{"prompt":"For $\\\\dfrac{dy}{dx} + 2y = e^{-x}$, what is the integrating factor $\\\\mu(x)$?","hint":"Compute $e^{\\\\int P(x)\\\\,dx}$ where $P(x) = 2$.","answer":"$\\\\mu(x) = e^{\\\\int 2\\\\,dx} = e^{2x}$."},{"prompt":"After multiplying by $\\\\mu = e^{2x}$, the left side becomes $\\\\dfrac{d}{dx}(e^{2x}y)$. Integrate both sides and solve for $y$.","hint":"The right side is $e^{2x}\\\\cdot e^{-x} = e^x$. Integrate $e^x$ to get $e^x + C$.","answer":"$e^{2x}y = e^x + C$, so $y = e^{-x} + Ce^{-2x}$."}]}
```

The one move doing all the work: multiply by $\mu$ so the left side becomes a single derivative. What follows is plain integration.
