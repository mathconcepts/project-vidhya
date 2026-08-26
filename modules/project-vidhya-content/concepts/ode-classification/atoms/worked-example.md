---
id: ode-classification.worked-example
concept_id: ode-classification
atom_type: worked_example
bloom_level: 3
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: true
---

## Worked Example: Classify $\left(\dfrac{d^2y}{dx^2}\right)^3 + \sqrt{\dfrac{dy}{dx}} + y = 0$

**Problem.** Find the order, degree, and linearity of

$$\left(\frac{d^2y}{dx^2}\right)^3 + \sqrt{\frac{dy}{dx}} + y = 0$$

**Step 1: Order.**

Scan the equation for the highest derivative present. Here that is $\dfrac{d^2y}{dx^2}$ — a second derivative.

**Order = 2.**

**Step 2: Is the equation polynomial in its derivatives?**

Not yet — $\dfrac{dy}{dx}$ sits under a square root, and a root is not an integer power. Before degree can be read off, the equation must be cleared of that root.

**Step 3: Clear the root, legally.**

Isolate the root term and square both sides:

$$\sqrt{\frac{dy}{dx}} = -\left(\frac{d^2y}{dx^2}\right)^3 - y$$

$$\frac{dy}{dx} = \left[-\left(\frac{d^2y}{dx^2}\right)^3 - y\right]^2$$

Every derivative now appears as an integer power — the equation is polynomial in its derivatives.

**Step 4: Degree.**

Read the power on the highest-order derivative, $\dfrac{d^2y}{dx^2}$, in the cleared equation. Expanding the square would raise $\left(\frac{d^2y}{dx^2}\right)^3$ to the power $2$ overall, so the term contributing the highest-order derivative appears as $\left(\dfrac{d^2y}{dx^2}\right)^6$ once fully expanded.

**Degree = 6.**

**Step 5: Linearity.**

$y''$ appears raised to a power other than 1, so the equation is **non-linear** regardless of degree.

$$\boxed{\text{order } 2,\quad \text{degree } 6,\quad \text{non-linear}}$$

---

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

---

**Summary:** Classifying an ODE takes three quick checks:
1. **Order** — which derivative is highest (always defined).
2. **Degree** — the power on that derivative, but only once the equation is polynomial in its derivatives (sometimes undefined).
3. **Linearity** — does $y$ and every derivative appear to the first power, with no products or non-linear wrapping?

Get these right before picking a solving technique — a second-order equation calls for a different method than a first-order one, and a non-linear equation rules out the linear-ODE toolkit entirely.
