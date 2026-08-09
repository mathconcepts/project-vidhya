# Basic Derivatives

> GATE Engineering Mathematics | Calculus | high frequency | difficulty: 0.2

## Intuition First

A derivative measures the instantaneous rate of change of a function — how fast the function's output is changing at a particular input value. Geometrically, it's the slope of the tangent line.

## Core Definition

**Derivative**: The derivative of $f$ at $x$ is:
$$f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$$

**Power Rule**: If $f(x) = x^n$, then $f'(x) = nx^{n-1}$.

**Exponential and Logarithm**: $\frac{d}{dx}[e^x] = e^x$, $\frac{d}{dx}[\ln(x)] = \frac{1}{x}$.

**Trigonometric**: $\frac{d}{dx}[\sin(x)] = \cos(x)$, $\frac{d}{dx}[\cos(x)] = -\sin(x)$, $\frac{d}{dx}[\tan(x)] = \sec^2(x)$.

## What Happens (Worked Example)

**Example**: Find $f'(x)$ for $f(x) = x^3 + 2x^2 - 5x + 1$.

**What happens**: Apply the power rule term-by-term:
- $\frac{d}{dx}[x^3] = 3x^2$
- $\frac{d}{dx}[2x^2] = 4x$
- $\frac{d}{dx}[-5x] = -5$
- $\frac{d}{dx}[1] = 0$

Therefore: $f'(x) = 3x^2 + 4x - 5$

**Why it works**: The power rule comes directly from the limit definition. At $x = 2$: $f'(2) = 3(4) + 4(2) - 5 = 19$, which is the slope of the tangent line at $(2, f(2))$.

## GATE MA Relevance

> **Why it matters in GATE MA:** Basic derivatives are the foundation for all calculus. GATE asks: compute $f'(x)$ using power, product, quotient, or chain rules. Often worth 1–2 marks (MCQ or NAT). Every derivative question requires these basics.
