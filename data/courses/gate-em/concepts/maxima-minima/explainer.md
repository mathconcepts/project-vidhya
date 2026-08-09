# Maxima & Minima

> GATE Engineering Mathematics | Calculus | high frequency | difficulty: 0.5

## Intuition First

Maxima and minima are the "peaks" and "valleys" of a function — where the function reaches its highest and lowest values. At these points, the tangent line is flat (horizontal), so the derivative is zero.

## Core Definition

**Critical Point**: A critical point of $f$ is a value $c$ where $f'(c) = 0$ or $f'(c)$ does not exist.

**Local Extrema**: 
- $f$ has a **local maximum** at $c$ if $f(c) \geq f(x)$ for all $x$ near $c$.
- $f$ has a **local minimum** at $c$ if $f(c) \leq f(x)$ for all $x$ near $c$.

**First Derivative Test**: If $f'(x)$ changes sign at $c$ from positive to negative, $f$ has a local max at $c$. If it changes from negative to positive, $f$ has a local min.

**Second Derivative Test**: If $f'(c) = 0$:
- If $f''(c) > 0$, then $f$ has a local minimum at $c$.
- If $f''(c) < 0$, then $f$ has a local maximum at $c$.
- If $f''(c) = 0$, the test is inconclusive.

## What Happens (Worked Example)

**Example**: Find the maxima and minima of $f(x) = x^3 - 3x$ on $[-2, 2]$.

Step 1: Find critical points. $f'(x) = 3x^2 - 3 = 3(x^2 - 1) = 0 \Rightarrow x = \pm 1$.

Step 2: Apply second derivative test. $f''(x) = 6x$.
- At $x = -1$: $f''(-1) = -6 < 0$ → local maximum at $(-1, f(-1)) = (-1, 2)$.
- At $x = 1$: $f''(1) = 6 > 0$ → local minimum at $(1, f(1)) = (1, -2)$.

Step 3: Check endpoints.
- $f(-2) = -8 + 6 = -2$
- $f(2) = 8 - 6 = 2$

**Global max on [-2,2]: $f(-2) = -2$ and $f(2) = 2$, so global max = $2$ at $x = 2$.
Global min on [-2,2]: $f(1) = -2$.**

## GATE MA Relevance

> **Why it matters in GATE MA:** Optimization is crucial in engineering. GATE asks: find critical points, determine whether max/min, or optimize a function. Often 2 marks (NAT). Combined with applications (e.g., "minimize cost").
