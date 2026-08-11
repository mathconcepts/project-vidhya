# Integration Basics

> GATE Engineering Mathematics | Calculus | high frequency | difficulty: 0.3

## Intuition First

Integration is the inverse of differentiation. If differentiation asks "how fast is this changing," integration asks "what accumulated the change." Geometrically, the integral is the area under a curve.

## Core Definition

**Antiderivative (Indefinite Integral)**: An antiderivative of $f$ is a function $F$ such that $F'(x) = f(x)$. We write:
$$\int f(x) \, dx = F(x) + C$$

**Power Rule for Integration**: 
$$\int x^n \, dx = \frac{x^{n+1}}{n+1} + C \quad (n \neq -1)$$

**Standard Integrals**:
- $\int e^x \, dx = e^x + C$
- $\int \frac{1}{x} \, dx = \ln|x| + C$
- $\int \sin(x) \, dx = -\cos(x) + C$
- $\int \cos(x) \, dx = \sin(x) + C$

## What Happens (Worked Example)

**Example**: Integrate $f(x) = 3x^2 + 2x - 5$.

Apply power rule term-by-term:
$$\int (3x^2 + 2x - 5) \, dx = 3 \cdot \frac{x^3}{3} + 2 \cdot \frac{x^2}{2} - 5x + C = x^3 + x^2 - 5x + C$$

**Verify**: $\frac{d}{dx}[x^3 + x^2 - 5x + C] = 3x^2 + 2x - 5$ ✓

## GATE MA Relevance

> **Why it matters in GATE MA:** Integration is inverse of differentiation. GATE asks: compute indefinite integrals (MCQ or NAT). Power rule, substitution, and by-parts are the main techniques. Often 1–2 marks.
