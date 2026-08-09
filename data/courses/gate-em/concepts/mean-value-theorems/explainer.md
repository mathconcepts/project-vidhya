# Mean Value Theorems

> GATE Engineering Mathematics | Calculus | high frequency | difficulty: 0.5

## Intuition First

The Mean Value Theorem says that if a function is continuous and smooth, somewhere between two points, the function's instantaneous rate of change (derivative) equals its average rate of change (slope of secant line).

## Core Definition

**Rolle's Theorem**: If $f$ is continuous on $[a,b]$, differentiable on $(a,b)$, and $f(a) = f(b)$, then there exists $c \in (a,b)$ such that $f'(c) = 0$.

**Mean Value Theorem (MVT)**: If $f$ is continuous on $[a,b]$ and differentiable on $(a,b)$, then there exists $c \in (a,b)$ such that:
$$f'(c) = \frac{f(b) - f(a)}{b - a}$$

**Cauchy's Mean Value Theorem**: If $f$ and $g$ are continuous on $[a,b]$, differentiable on $(a,b)$, and $g'(x) \neq 0$ on $(a,b)$, then:
$$\frac{f'(c)}{g'(c)} = \frac{f(b) - f(a)}{g(b) - g(a)}$$

## What Happens (Worked Example)

**Example**: Verify MVT for $f(x) = x^2$ on $[1, 3]$.

Conditions: $f$ is continuous and differentiable everywhere ✓

Average rate of change: $\frac{f(3) - f(1)}{3 - 1} = \frac{9 - 1}{2} = 4$

Instantaneous rate: $f'(x) = 2x = 4 \Rightarrow x = 2$

Since $2 \in (1, 3)$, the theorem is satisfied. At $x = 2$, the tangent slope equals the secant slope.

## GATE MA Relevance

> **Why it matters in GATE MA:** MVT guarantees existence of critical values and roots. GATE asks: verify MVT, find the point $c$, or use MVT to prove inequalities. Often 2 marks (MCQ or NAT theory).
