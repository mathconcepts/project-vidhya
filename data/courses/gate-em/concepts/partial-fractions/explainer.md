# Partial Fractions

> GATE Engineering Mathematics | Calculus | medium frequency | difficulty: 0.4

## Intuition First

Partial fractions decompose a complex rational function into simpler fractions that are easy to integrate. Instead of integrating a complicated quotient, you break it into pieces.

## Core Definition

**Partial Fraction Decomposition**: Express a rational function $\frac{P(x)}{Q(x)}$ as a sum of simpler fractions. If $Q(x)$ factors into linear terms $(x - a_1)(x - a_2)\cdots(x - a_n)$, then:
$$\frac{P(x)}{Q(x)} = \frac{A_1}{x - a_1} + \frac{A_2}{x - a_2} + \cdots + \frac{A_n}{x - a_n}$$

**Cases**:
- **Distinct linear factors**: $\frac{P(x)}{(x-a)(x-b)} = \frac{A}{x-a} + \frac{B}{x-b}$
- **Repeated linear factors**: $\frac{P(x)}{(x-a)^n}$ requires $\frac{A_1}{x-a} + \frac{A_2}{(x-a)^2} + \cdots + \frac{A_n}{(x-a)^n}$
- **Irreducible quadratic**: $\frac{P(x)}{(x^2 + px + q)}$ requires $\frac{Ax + B}{x^2 + px + q}$

## What Happens (Worked Example)

**Example**: Decompose and integrate $\int \frac{5x + 7}{(x+1)(x+2)} dx$.

**Decomposition**: $\frac{5x+7}{(x+1)(x+2)} = \frac{A}{x+1} + \frac{B}{x+2}$

Multiply by $(x+1)(x+2)$: $5x + 7 = A(x+2) + B(x+1)$
- At $x = -1$: $2 = A(1) \Rightarrow A = 2$
- At $x = -2$: $-3 = B(-1) \Rightarrow B = 3$

**Integration**: $\int \frac{2}{x+1} dx + \int \frac{3}{x+2} dx = 2\ln|x+1| + 3\ln|x+2| + C$

## GATE MA Relevance

> **Why it matters in GATE MA:** Partial fractions are essential for integrating rational functions. GATE asks: decompose and integrate (MCQ or NAT). Often 2 marks. Test whether students recognize linear vs. repeated factors.
