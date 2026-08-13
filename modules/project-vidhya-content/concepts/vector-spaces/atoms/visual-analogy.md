---
id: vector-spaces-visual-analogy
concept_id: vector-spaces
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# A Country and Its Regions

Think of a **vector space** as an entire country. Every location in the country is a valid vector. You can travel anywhere, combine journeys, and scale distances — and you always stay within the country's borders.

```gif-scene
{
  "type": "function-trace",
  "expression": "2*sin(x)",
  "x_range": [-6, 6],
  "y_range": [-3, 3],
  "label": "Span of sin(x) in function space"
}
```

A **subspace** is a special region within that country — like a state or a province. But it has strict rules: it must contain the **capital city** (the zero vector), and if two roads exist in the region, their combination must also stay in the region.

## The Three Border Rules for a Subspace

| Rule | What it means geographically |
|---|---|
| Contains zero | The capital is inside the region |
| Closed under addition | Following two in-region roads stays in the region |
| Closed under scalar multiplication | Stretching or shrinking an in-region journey stays in-region |

Break any rule and the region is **not** a subspace.

## Which Regions Qualify?

In $\mathbb{R}^2$ (a flat 2-D country), the valid subspaces are exactly:
- The **origin alone** $\{(0,0)\}$ — the capital as its own micro-region
- Any **line through the origin** — a road that passes through the capital
- The **whole country** $\mathbb{R}^2$ itself

A line that does *not* pass through the origin (like $y = x + 1$) fails the capital test immediately — $(0,0)$ is not on it.

## The Span as a Territory

The **span** of a set of vectors is the smallest subspace-region that contains all those vectors. Start at the origin, walk in any combination of the given directions, and shade every reachable point. That shaded area is the span.

In $\mathbb{R}^3$: the span of one non-zero vector is a **line**; the span of two non-parallel vectors is a **plane**; the span of three linearly independent vectors is all of $\mathbb{R}^3$.

## Function Spaces — A Wider Country

The space of all functions on $[-\pi, \pi]$ is a vast country. The set $\{c\cdot\sin(x) : c\in\mathbb{R}\}$ is a single "road" through the origin in that country — a 1-dimensional subspace, spanned by $\sin(x)$. The GIF above traces that road: every point on the curve $2\sin(x)$ is just $\sin(x)$ scaled by 2, so it stays in the same subspace.

## GATE Application — Instant Subspace Test

When GATE asks "Is $W$ a subspace?", run the three tests in order:

1. **Is $\mathbf{0}$ in $W$?** If not, stop — answer is No.
2. **Pick two arbitrary elements and add them — is the result in $W$?** If not, stop — No.
3. **Multiply an arbitrary element by an arbitrary scalar — still in $W$?** If not — No.

All three pass? Then $W$ is a subspace. Three checks, no exceptions.
