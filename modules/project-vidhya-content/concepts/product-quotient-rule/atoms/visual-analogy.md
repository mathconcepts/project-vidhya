---
id: product-quotient-rule-visual-analogy
concept_id: product-quotient-rule
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Product Rule — The Growing Rectangle

## The Analogy

Imagine a **rectangle** whose width is $u(x)$ and whose height is $v(x)$. Both dimensions grow as $x$ increases.

The area is $A(x) = u(x) \cdot v(x)$.

When $x$ ticks forward by a tiny amount $dx$:

- The width grows by $du = u'(x)\,dx$
- The height grows by $dv = v'(x)\,dx$

The new area is divided into three strips:

```
┌────────────────────┬──────┐
│                    │      │
│   Original area    │ u·dv │   ← height grew
│       u·v          │      │
│                    │      │
├────────────────────┼──────┤
│       v·du         │ tiny │   ← width grew
└────────────────────┴──────┘
```

- **Bottom strip** ($v \cdot du$): the old height times the new width growth
- **Right strip** ($u \cdot dv$): the old width times the new height growth
- **Corner square** ($du \cdot dv$): infinitesimally small — ignored

So:

$$\frac{dA}{dx} = v \cdot u' + u \cdot v' = u'v + uv'$$

This is exactly the **product rule** — visualized as two dominant strips of a growing rectangle.

---

## Quotient Rule Connection

The quotient $u/v$ asks: "If area $u$ is spread over height $v$, what's the width?" As both change, the quotient rule tracks how that width changes — and the subtraction in the numerator comes from the fact that a growing denominator *shrinks* the result.

---

## Seeing It in Action

The function $f(x) = x \cdot \sin(x)$ is a product of $u = x$ and $v = \sin(x)$.

By the product rule:

$$f'(x) = (1)\cdot\sin(x) + x \cdot \cos(x) = \sin(x) + x\cos(x)$$

Watch how the curve grows and oscillates — the derivative captures the interplay between the linear growth of $x$ and the oscillation of $\sin(x)$:

```gif-scene
{
  "type": "function-trace",
  "expression": "x * sin(x)",
  "x_range": [0, 10],
  "y_range": [-10, 10],
  "label": "d/dx[x·sin(x)] = sin(x) + x·cos(x)"
}
```

Notice how the amplitude of oscillation grows with $x$ — that's the $x$ factor in the product amplifying $\sin(x)$ over time.

---

## Connecting to the Formula

| Rectangle piece | Algebraic meaning |
|---|---|
| Right strip: $u \cdot dv$ | $u(x) \cdot v'(x)\,dx$ → first term $uv'$ |
| Bottom strip: $v \cdot du$ | $v(x) \cdot u'(x)\,dx$ → second term $u'v$ |

The rectangle makes the formula **impossible to forget**: two strips, two terms.
