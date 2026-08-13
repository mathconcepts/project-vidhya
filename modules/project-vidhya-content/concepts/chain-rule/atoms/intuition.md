---
id: chain-rule-intuition
concept_id: chain-rule
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Chain Rule — Intuition

## Differentiating Composite Functions

The **chain rule** tells you how to differentiate a function that is built by composing two (or more) functions. If $y = f(u)$ and $u = g(x)$, so that $y = f(g(x))$, then:

$$\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx} = f'(g(x)) \cdot g'(x)$$

Read it as: **"derivative of the outer function, evaluated at the inner, times the derivative of the inner function."**

## Identifying Composite Structure

Before differentiating, ask: *Can I write this as $f(g(x))$?*

| Function $y$ | Outer $f(u)$ | Inner $g(x)$ |
|---|---|---|
| $\sin(x^2)$ | $\sin(u)$ | $x^2$ |
| $e^{3x+1}$ | $e^u$ | $3x+1$ |
| $\ln(\cos x)$ | $\ln(u)$ | $\cos x$ |
| $(2x^2 + 1)^5$ | $u^5$ | $2x^2 + 1$ |

The inner function $g(x)$ is whatever sits "inside" the main operation.

## The Slogan

> **Outer prime at inner, times inner prime.**

For $y = f(g(x))$:

$$y' = \underbrace{f'(g(x))}_{\text{outer prime at inner}} \cdot \underbrace{g'(x)}_{\text{inner prime}}$$

## Chain of Three: Extended Chain Rule

For $y = f(g(h(x)))$:

$$\frac{dy}{dx} = f'(g(h(x))) \cdot g'(h(x)) \cdot h'(x)$$

Each layer contributes its own derivative factor. A chain of $n$ compositions produces $n$ derivative factors multiplied together.

## Multivariable Extension

In multivariable calculus, if $z = f(x, y)$ where $x = x(t)$ and $y = y(t)$:

$$\frac{dz}{dt} = \frac{\partial f}{\partial x}\frac{dx}{dt} + \frac{\partial f}{\partial y}\frac{dy}{dt}$$

This is the multivariable chain rule — a sum of partial-derivative contributions, one per variable that depends on $t$. GATE tests this in implicit differentiation, Jacobian problems, and PDEs.

## Common Mistakes

| Mistake | Correct approach |
|---|---|
| Forgetting to multiply by $g'(x)$ | Always write the inner derivative explicitly |
| Differentiating the inner without the outer | Differentiate outer first, evaluated at inner |
| Applying quotient rule when chain rule suffices | Rewrite $1/g(x) = [g(x)]^{-1}$ and chain-rule it |
