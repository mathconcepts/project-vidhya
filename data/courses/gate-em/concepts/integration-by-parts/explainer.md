# Integration by Parts

> GATE Engineering Mathematics | Calculus | high frequency | difficulty: 0.5

## Intuition First

Integration by parts is the reverse of the product rule. Use it when you have a product of two functions where one becomes simpler when differentiated (like $x$ or $\ln(x)$) and the other is easy to integrate.

## Core Definition

**Integration by Parts Formula**:
$$\int u \, dv = uv - \int v \, du$$

**Strategy**: Choose $u$ and $dv$ such that:
1. $du$ is simpler than $u$
2. $v$ is easy to find from $dv$
3. The new integral $\int v \, du$ is easier than the original

**LIATE Rule**: Prioritize choosing $u$ as (in order): Logarithm, Inverse trig, Algebraic (polynomial), Trigonometric, Exponential.

## What Happens (Worked Example)

**Example**: Evaluate $\int x e^x \, dx$.

**What happens:**
- Choose $u = x$ (algebraic, gets simpler), $dv = e^x dx$
- Compute: $du = dx$, $v = e^x$
- Apply formula: $\int x e^x \, dx = x e^x - \int e^x \, dx = x e^x - e^x + C = e^x(x - 1) + C$

**Verify**: $\frac{d}{dx}[e^x(x-1)] = e^x(x-1) + e^x = e^x \cdot x$ ✓

## GATE MA Relevance

> **Why it matters in GATE MA:** By-parts handles products of functions. GATE asks: evaluate $\int x e^x dx$, $\int x \sin(x) dx$, $\int \ln(x) dx$ (MCQ or NAT). Often 2 marks. Sometimes requires two applications.
