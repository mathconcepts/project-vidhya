# Integration by Substitution

> GATE Engineering Mathematics | Calculus | high frequency | difficulty: 0.4

## Intuition First

Integration by substitution (u-substitution) is the reverse of the chain rule. If you see a composite function in the integrand, identify the inner function, substitute it with $u$, and simplify.

## Core Definition

**Substitution Rule**: If $u = g(x)$ and $du = g'(x) dx$, then:
$$\int f(g(x)) \cdot g'(x) \, dx = \int f(u) \, du$$

The strategy: identify the composite function, let the inner part be $u$, compute $du$, rewrite the integral, integrate with respect to $u$, and substitute back.

## What Happens (Worked Example)

**Example**: Evaluate $\int 2x \cos(x^2) \, dx$.

**What happens:**
- Identify inner function: $u = x^2$
- Compute $du$: $du = 2x \, dx$
- Rewrite: $\int 2x \cos(x^2) \, dx = \int \cos(u) \, du$
- Integrate: $\int \cos(u) \, du = \sin(u) + C$
- Substitute back: $\sin(x^2) + C$

**Verify**: $\frac{d}{dx}[\sin(x^2) + C] = \cos(x^2) \cdot 2x = 2x\cos(x^2)$ ✓

## GATE MA Relevance

> **Why it matters in GATE MA:** Substitution handles composite functions that the power rule can't touch. GATE asks: evaluate $\int f(g(x)) g'(x) \, dx$ by substitution (MCQ or NAT). Often 1–2 marks. Combined with other techniques for harder problems.
