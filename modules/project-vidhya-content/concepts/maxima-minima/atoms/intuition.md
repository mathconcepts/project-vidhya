---
id: maxima-minima-intuition
concept_id: maxima-minima
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Maxima and Minima — Intuition

## The Big Picture

A function's **extrema** (maxima and minima) are the peaks and valleys of its graph. Finding them is one of the most tested topics in GATE Mathematics, appearing in optimization problems, curve sketching, and Lagrange multiplier questions.

---

## Step 1: Find Critical Points

A **critical point** is any $x = c$ where:
- $f'(c) = 0$ (horizontal tangent), **or**
- $f'(c)$ does not exist (corner, cusp, vertical tangent)

> Critical points are **candidates** for extrema — not every critical point is an extremum.

---

## Step 2: Classify with the First Derivative Test

Examine the **sign of $f'$** on either side of the critical point:

| $f'$ before $c$ | $f'$ after $c$ | Conclusion |
|---|---|---|
| $+$ (increasing) | $-$ (decreasing) | **Local maximum** at $c$ |
| $-$ (decreasing) | $+$ (increasing) | **Local minimum** at $c$ |
| Same sign | Same sign | **Neither** — inflection point |

---

## Step 3: Classify with the Second Derivative Test (faster when applicable)

At a critical point $c$ where $f'(c) = 0$:

$$f''(c) > 0 \implies \text{local minimum (concave up — "smile")}$$

$$f''(c) < 0 \implies \text{local maximum (concave down — "frown")}$$

$$f''(c) = 0 \implies \text{test inconclusive — use first derivative test}$$

---

## Global (Absolute) Extrema on a Closed Interval $[a, b]$

For GATE problems on $[a, b]$, use the **Closed Interval Method**:

1. Find all critical points inside $(a, b)$
2. Evaluate $f$ at each critical point **and** at both endpoints $a$ and $b$
3. The largest value is the **global maximum**; the smallest is the **global minimum**

> Endpoints are mandatory — a global extremum can occur at $x = a$ or $x = b$ even with no critical point there.

---

## Multivariable: Saddle Points

For $f(x, y)$ at a critical point $(a, b)$ where $f_x = f_y = 0$, define the **discriminant**:

$$D = f_{xx}\,f_{yy} - (f_{xy})^2$$

| $D$ | $f_{xx}$ | Conclusion |
|---|---|---|
| $D > 0$ | $> 0$ | Local minimum |
| $D > 0$ | $< 0$ | Local maximum |
| $D < 0$ | — | **Saddle point** |
| $D = 0$ | — | Inconclusive |

A **saddle point** is neither a maximum nor a minimum — the function increases in some directions and decreases in others (like the center of a mountain pass).

---

## Quick Reference

- $f'(c) = 0$: necessary condition for interior extremum
- $f'$ changes sign: guarantees an extremum
- $f'' \neq 0$: quick second-derivative test (sufficient condition)
- Closed interval: always check **endpoints + critical points**
