# Definite Integrals

> GATE Engineering Mathematics | Calculus | high frequency | difficulty: 0.4

## Intuition First

A definite integral computes the signed area between a curve and the x-axis over an interval $[a, b]$. The "signed" part means area above the x-axis counts as positive, below as negative.

## Core Definition

**Definite Integral**: 
$$\int_a^b f(x) \, dx = F(b) - F(a)$$

where $F$ is an antiderivative of $f$ (the Fundamental Theorem of Calculus).

**Properties**:
- $\int_a^a f(x) dx = 0$
- $\int_a^b f(x) dx = -\int_b^a f(x) dx$
- $\int_a^c f(x) dx + \int_c^b f(x) dx = \int_a^b f(x) dx$ (additivity)
- $\int_a^b [f(x) + g(x)] dx = \int_a^b f(x) dx + \int_a^b g(x) dx$ (linearity)

## What Happens (Worked Example)

**Example**: Compute $\int_0^2 (x^2 + 1) dx$.

Find antiderivative: $F(x) = \frac{x^3}{3} + x$

Apply FTC: $\int_0^2 (x^2 + 1) dx = F(2) - F(0) = (\frac{8}{3} + 2) - 0 = \frac{8}{3} + 2 = \frac{14}{3}$

Geometrically: This is the area under the parabola $y = x^2 + 1$ from $x = 0$ to $x = 2$.

## GATE MA Relevance

> **Why it matters in GATE MA:** Definite integrals compute areas, moments, and work. GATE asks: evaluate $\int_a^b f(x) dx$ (MCQ or NAT). Often 1–2 marks. Combined with geometric interpretation.
