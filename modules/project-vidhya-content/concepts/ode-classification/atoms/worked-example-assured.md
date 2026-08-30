---
# Alternative body for ode-classification.worked-example, served when the
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
id: ode-classification.worked-example.assured
concept_id: ode-classification
atom_type: worked_example
bloom_level: 3
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: true
variant_of: ode-classification.worked-example
for_stance: assured
---

## Order is free, degree is not

For $\left(\dfrac{d^2y}{dx^2}\right)^3 + \sqrt{\dfrac{dy}{dx}} + y = 0$, order is immediate — the highest derivative present is $y''$, so order $= 2$, independent of anything else in the equation.

Degree is the trap. $\sqrt{y'}$ is a root, not an integer power, so the equation is not yet polynomial in its derivatives — reading an exponent off it now is undefined, not $3$. Isolate the root and square both sides first: $(y'')^3$ squared becomes $(y'')^6$ once expanded, so degree $= 6$. Skipping that clearing step, not the algebra afterward, is where marks go missing.

$$\boxed{\text{order } 2,\quad \text{degree } 6,\quad \text{non-linear}}$$

Linearity is settled independently of the degree value: $y''$ appears raised to a power other than $1$, which alone rules out linear.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: classifying an ODE with a root in it",
  "steps": [
    {
      "prompt": "For $\\left(\\dfrac{d^2y}{dx^2}\\right)^3 + \\sqrt{\\dfrac{dy}{dx}} + y = 0$, what is the order?",
      "hint": "Order only cares about WHICH derivative is highest, never about the powers or the roots around it.",
      "answer": "Order = 2, from $\\dfrac{d^2y}{dx^2}$ — the second derivative is the highest one present."
    },
    {
      "prompt": "Can you read the degree directly off this equation as written? Why or why not?",
      "hint": "Look at what is sitting under the square root.",
      "answer": "No. $\\dfrac{dy}{dx}$ is under a square root, so the equation is not yet polynomial in its derivatives — degree is only defined AFTER that is cleared."
    },
    {
      "prompt": "How do you clear the square root without changing the solution set?",
      "hint": "Isolate the root term on one side, then apply the same operation to both sides.",
      "answer": "Isolate $\\sqrt{dy/dx}$ on one side and square both sides: $\\dfrac{dy}{dx} = \\left[-\\left(\\dfrac{d^2y}{dx^2}\\right)^3 - y\\right]^2$. Now every derivative is an integer power."
    },
    {
      "prompt": "In the cleared equation, what power does the highest-order derivative $y''$ end up raised to, and so what is the degree?",
      "hint": "$y''$ appeared as $(y'')^3$ before squaring; squaring that whole bracket squares the exponent too.",
      "answer": "$(y'')^3$ squared becomes $(y'')^6$, so degree = 6."
    },
    {
      "prompt": "Is this equation linear or non-linear, and why?",
      "hint": "Linear requires $y$ and every derivative to appear only to the first power, with no products between them.",
      "answer": "Non-linear — $y''$ is raised to a power other than 1 (degree 6), which alone rules out linearity."
    }
  ],
  "caption": "Exam insight: never read degree off an equation that still has a derivative under a root, in a denominator, or inside sin/cos/log/e — clear it first, then read the power. If it can't be cleared at all (e.g. sin(y')), degree is undefined, not 1."
}
```

The same block applies to a derivative under a root, in a denominator, or inside $\sin, \cos, \log, e$ — clear it, then read the power. If it genuinely cannot be cleared (e.g. $\sin(y')$), degree is undefined, not $1$.
