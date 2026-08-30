---
# Alternative body for ode-bernoulli-worked-example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: ode-bernoulli.worked-example.assured
concept_id: ode-bernoulli
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: ode-bernoulli-worked-example
for_stance: assured
---

## Solve $\dfrac{dy}{dx} - y = xy^2$, and where marks actually go

$P = -1$, $Q = x$, $n = 2$, and the equation is already in standard form $y' + Py = Qy^n$ — confirm that before dividing, since a stray coefficient on $y'$ would silently change both $P$ and every integrating factor downstream.

Dividing by $y^2$ and setting $v = y^{-1}$ collapses this to $v' + v = -x$, linear with integrating factor $e^x$. Integration by parts on $\int xe^x\,dx = xe^x - e^x$ gives $v = 1 - x + Ce^{-x}$, so

$$\boxed{y(x) = \dfrac{1}{1 - x + Ce^{-x}}}$$

Substituting back confirms $\dfrac{dy}{dx} - y = xy^2$ holds identically in $C$.

The line worth writing, not skipping: dividing by $y^2$ assumes $y \neq 0$, and $y \equiv 0$ also solves the original equation — it just doesn't appear in the boxed family above, since division erased it.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving the Bernoulli ODE dy/dx − y = xy²","steps":[{"prompt":"For $\\\\dfrac{dy}{dx} - y = xy^2$, identify $n$, $P(x)$, and $Q(x)$.","hint":"Write in standard form $y' + P(x)y = Q(x)y^n$ and match each part.","answer":"$n = 2$, $P(x) = -1$, $Q(x) = x$. The equation is $y' + (-1)y = x \\\\cdot y^2$."},{"prompt":"What substitution do you make, and how does $y^{-2}\\\\dfrac{dy}{dx}$ transform?","hint":"Set $v = y^{1-n} = y^{-1}$. Differentiate both sides with respect to $x$.","answer":"$v = y^{-1}$, so $\\\\frac{dv}{dx} = -y^{-2}\\\\frac{dy}{dx}$, meaning $y^{-2}\\\\frac{dy}{dx} = -\\\\frac{dv}{dx}$. The Bernoulli becomes $\\\\frac{dv}{dx} + v = -x$."},{"prompt":"After solving for $v = 1 - x + Ce^{-x}$, write the final answer for $y(x)$ and then find $C$ if $y(0) = 1$.","hint":"Recall $v = 1/y$, so $y = 1/v$. Substitute $x=0$, $y=1$ into the general solution.","answer":"$y(x) = \\\\dfrac{1}{1 - x + Ce^{-x}}$. With $y(0)=1$: $1 = 1/(1+C)$, so $C = 0$ and $y = \\\\dfrac{1}{1-x}$."}]}
```
