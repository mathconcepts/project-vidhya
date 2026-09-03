---
id: chain-rule-visual-analogy
concept_id: chain-rule
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Chain Rule — Visual Analogy

## The Gear Train

Imagine three gears: **A**, **B**, and **C**, connected in a chain.

- Gear A turns Gear B with ratio $r_1$ (one turn of A produces $r_1$ turns of B).
- Gear B turns Gear C with ratio $r_2$ (one turn of B produces $r_2$ turns of C).

How fast does Gear C turn for each turn of Gear A?

$$\text{Speed of C per turn of A} = r_1 \times r_2$$

You multiply the individual ratios — exactly what the chain rule does with derivatives.

In calculus terms: if $y$ changes $r_1$ units per unit of $u$, and $u$ changes $r_2$ units per unit of $x$, then $y$ changes $r_1 \times r_2$ units per unit of $x$:

$$\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx}$$

Add more gears, multiply more ratios. A chain of $n$ gears gives $n$ derivative factors.

## The Speed Amplifier

A faster inner oscillation gets amplified in the derivative. When we differentiate $\sin(2x)$, the factor of $2$ inside doubles the frequency — and that factor reappears as a multiplier in the derivative:

$$\frac{d}{dx}\sin(2x) = \cos(2x) \cdot 2 = 2\cos(2x)$$

The diagram on this card traces $\sin(2x)$ across one full period. The oscillation is **twice as fast** as plain $\sin(x)$ — and the derivative $2\cos(2x)$ is twice as large in amplitude, reflecting that speed:

```gif-scene
{
  "type": "function-trace",
  "expression": "sin(2 * x)",
  "x_range": [-6.28, 6.28],
  "y_range": [-1.5, 1.5],
  "label": "d/dx sin(2x) = 2cos(2x) — chain rule"
}
```

## Reading the Gears in Every Problem

When you see a composite function, mentally label the gears:

$$y = e^{\cos(x)} \quad \Rightarrow \quad \underbrace{e^u}_{\text{Gear B outer}} \quad u = \underbrace{\cos(x)}_{\text{Gear A inner}}$$

$$\frac{dy}{dx} = e^{\cos(x)} \cdot (-\sin x)$$

Outer prime (at inner) times inner prime — one gear ratio for each link in the chain.

## Key Takeaway

> The chain rule is the calculus of connected rates. Every intermediate variable contributes its own "gear ratio" — and they all multiply together.
