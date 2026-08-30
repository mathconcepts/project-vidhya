---
# Alternative body for ode-bernoulli-worked-example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
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
id: ode-bernoulli.worked-example.shaken
concept_id: ode-bernoulli
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: ode-bernoulli-worked-example
for_stance: shaken
---

## Solve $\dfrac{dy}{dx} - y = xy^2$

**Classify.** Match against $y' + Py = Qy^n$: here $P = -1$, $Q = x$, $n = 2$. Since $n \neq 0, 1$, this is genuinely Bernoulli.

**Solve.** Divide by $y^2$: $y^{-2}y' - y^{-1} = x$. Set $v = y^{-1}$, so $\dfrac{dv}{dx} = -y^{-2}y'$, and the equation becomes $-\dfrac{dv}{dx} - v = x$, i.e.

$$\dfrac{dv}{dx} + v = -x$$

Integrating factor $e^x$: $\dfrac{d}{dx}(e^xv) = -xe^x$. Integrate by parts on the right, $\int xe^x\,dx = xe^x - e^x$, giving $e^xv = e^x - xe^x + C$, so $v = 1 - x + Ce^{-x}$.

Back-substitute $y = 1/v$:

$$\boxed{y(x) = \dfrac{1}{1 - x + Ce^{-x}}}$$

**Check.** Differentiate $1/y = 1-x+Ce^{-x}$ implicitly: $-y^{-2}y' = -1 - Ce^{-x}$, so $y' = y^2(1+Ce^{-x})$. Since $1 + Ce^{-x} = \frac{1}{y} + x$, this gives $y' - y = y^2\left(\frac1y + x\right) - y = xy^2$. Matches the original equation.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving the Bernoulli ODE dy/dx − y = xy²","steps":[{"prompt":"For $\\\\dfrac{dy}{dx} - y = xy^2$, identify $n$, $P(x)$, and $Q(x)$.","hint":"Write in standard form $y' + P(x)y = Q(x)y^n$ and match each part.","answer":"$n = 2$, $P(x) = -1$, $Q(x) = x$. The equation is $y' + (-1)y = x \\\\cdot y^2$."},{"prompt":"What substitution do you make, and how does $y^{-2}\\\\dfrac{dy}{dx}$ transform?","hint":"Set $v = y^{1-n} = y^{-1}$. Differentiate both sides with respect to $x$.","answer":"$v = y^{-1}$, so $\\\\frac{dv}{dx} = -y^{-2}\\\\frac{dy}{dx}$, meaning $y^{-2}\\\\frac{dy}{dx} = -\\\\frac{dv}{dx}$. The Bernoulli becomes $\\\\frac{dv}{dx} + v = -x$."},{"prompt":"After solving for $v = 1 - x + Ce^{-x}$, write the final answer for $y(x)$ and then find $C$ if $y(0) = 1$.","hint":"Recall $v = 1/y$, so $y = 1/v$. Substitute $x=0$, $y=1$ into the general solution.","answer":"$y(x) = \\\\dfrac{1}{1 - x + Ce^{-x}}$. With $y(0)=1$: $1 = 1/(1+C)$, so $C = 0$ and $y = \\\\dfrac{1}{1-x}$."}]}
```

Hold onto this: dividing by $y^n$ is the whole trick — everything after that is integrating-factor work you already know.
