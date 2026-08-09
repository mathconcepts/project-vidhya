# Chain Rule

> GATE Engineering Mathematics | Calculus | high frequency | difficulty: 0.4

## Intuition First

The chain rule tells you how to differentiate composite functions — functions built from other functions. If $y$ depends on $u$, and $u$ depends on $x$, then $dy/dx = (dy/du) \cdot (du/dx)$.

## Core Definition

**Chain Rule**: If $f = g \circ h$, meaning $f(x) = g(h(x))$, then:
$$f'(x) = g'(h(x)) \cdot h'(x)$$

Or in Leibniz notation: If $y = g(u)$ and $u = h(x)$, then:
$$\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx}$$

## What Happens (Worked Example)

**Example**: Find the derivative of $f(x) = (3x^2 + 1)^5$.

**What happens**: Let $u = 3x^2 + 1$ (inner function) and $y = u^5$ (outer function).

- Outer derivative: $\frac{dy}{du} = 5u^4 = 5(3x^2 + 1)^4$
- Inner derivative: $\frac{du}{dx} = 6x$

Apply chain rule:
$$f'(x) = 5(3x^2 + 1)^4 \cdot 6x = 30x(3x^2 + 1)^4$$

**Why it works**: The factor $(3x^2 + 1)^4$ is how fast $u^5$ changes with respect to $u$. The factor $6x$ is how fast $u$ changes with respect to $x$. Together, they give the rate of change of the entire composition.

## GATE MA Relevance

> **Why it matters in GATE MA:** The chain rule appears in almost every calculus question involving composite functions. GATE asks: compute derivatives of $\sin(x^2)$, $e^{3x}$, $\sqrt{2x+1}$, etc. Often 1–2 marks. Mastery is essential.
