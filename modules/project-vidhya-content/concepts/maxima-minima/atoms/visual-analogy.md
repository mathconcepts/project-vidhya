---
id: maxima-minima-visual-analogy
concept_id: maxima-minima
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Maxima and Minima — The Mountain Hike

## The Analogy

Imagine hiking across a hilly landscape:

- **Peaks** — you're at a local **maximum**. Ground slopes up on the way in, slopes down on the way out. If you're at the highest point in the entire region, it's a **global maximum**.
- **Valleys** — you're at a local **minimum**. Ground slopes down on the way in, slopes up on the way out.
- **Flat passes** — ground is momentarily flat, but you're neither at a peak nor a valley. These are **saddle points** (in 2D: inflection points with $f'=0$ but no sign change).

The **derivative** is your inclinometer — it tells you whether the slope ahead of you is positive (uphill), negative (downhill), or zero (momentarily flat).

---

## What the Derivative Tells You

| Your location | $f'(x)$ reading | What's happening |
|---|---|---|
| Climbing toward a peak | $f' > 0$ | Increasing |
| At the peak | $f' = 0$ | Momentarily flat |
| Descending from peak | $f' < 0$ | Decreasing |
| At a valley | $f' = 0$ | Momentarily flat |
| Flat pass (inflection) | $f' = 0$ | Flat but no sign change |

A **sign change** in $f'$ is the proof that you've crossed a peak or valley — not merely a flat section of path.

---

## Seeing a Classic Example

The function $f(x) = x^3 - 3x$ has:
- $f'(x) = 3x^2 - 3 = 3(x-1)(x+1)$
- Critical points at $x = \pm 1$
- $f'$ changes $+ \to -$ at $x = -1$: **local maximum**
- $f'$ changes $- \to +$ at $x = +1$: **local minimum**

```gif-scene
{
  "type": "function-trace",
  "expression": "x^3 - 3*x",
  "x_range": [-2.5, 2.5],
  "y_range": [-3, 3],
  "label": "f(x)=x³−3x: max at x=−1, min at x=1"
}
```

The curve on this card rises to a local peak at $(-1, 2)$, then dips to a local valley at $(1, -2)$, then rises again. The "flat" moments at both critical points are where the hiker pauses at the top of a hill or the bottom of a valley.

---

## The Second Derivative as Curvature

The second derivative $f''$ tells you whether the landscape is **concave up** (bowl — local min) or **concave down** (dome — local max):

- **Bowl shape** ($f'' > 0$): water would pool here → local minimum
- **Dome shape** ($f'' < 0$): ball would roll off → local maximum

For $f(x) = x^3 - 3x$:
- $f''(x) = 6x$
- At $x = -1$: $f''(-1) = -6 < 0$ → dome → **local maximum** ✓
- At $x = +1$: $f''(1) = +6 > 0$ → bowl → **local minimum** ✓

---

## The Global Trap

A local maximum is only the highest point **nearby** — not necessarily the highest point overall. In a mountain range, a local peak may be shorter than a distant mountain. On a **closed interval**, the global maximum might be at an endpoint, not at any interior critical point.

This is why the closed-interval method always evaluates **endpoints** — the highest point of your hike might be the trailhead, not any summit you reach along the way.
