---
# Alternative body for ode-classification.worked-example, served when the
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
id: ode-classification.worked-example.shaken
concept_id: ode-classification
atom_type: worked_example
bloom_level: 3
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: true
variant_of: ode-classification.worked-example
for_stance: shaken
---

## Classify $\left(\dfrac{d^2y}{dx^2}\right)^3 + \sqrt{\dfrac{dy}{dx}} + y = 0$

**Order.** Find the highest derivative written anywhere in the equation: $\dfrac{d^2y}{dx^2}$. It is a second derivative, so order $= 2$.

**Not yet degree.** $\dfrac{dy}{dx}$ sits under a square root, and a root is not a whole-number power. Degree cannot be read off an equation in this shape.

**Clear the root.** Isolate the root term, then square both sides:

$$\frac{dy}{dx}=\left[-\left(\frac{d^2y}{dx^2}\right)^3-y\right]^2$$

Every derivative is now a whole-number power.

**Degree.** $\left(\dfrac{d^2y}{dx^2}\right)^3$, once squared, becomes $\left(\dfrac{d^2y}{dx^2}\right)^6$. Degree $= 6$.

**Linearity.** $y''$ is raised to a power other than $1$, so the equation is non-linear.

$$\boxed{\text{order } 2,\quad \text{degree } 6,\quad \text{non-linear}}$$

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

One idea to hold onto: never read degree off an equation while a derivative is still trapped under a root — clear it first.
