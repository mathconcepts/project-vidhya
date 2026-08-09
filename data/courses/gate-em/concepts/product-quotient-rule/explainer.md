# Product & Quotient Rule

> GATE Engineering Mathematics | Calculus | high frequency | difficulty: 0.3

## Intuition First

When two functions multiply, their rates of change don't simply multiply — each function contributes to the overall rate of change. The product rule captures this coupling.

## Core Definition

**Product Rule**: If $f(x) = u(x) \cdot v(x)$, then:
$$f'(x) = u'(x) \cdot v(x) + u(x) \cdot v'(x)$$

**Quotient Rule**: If $f(x) = \frac{u(x)}{v(x)}$, then:
$$f'(x) = \frac{u'(x) \cdot v(x) - u(x) \cdot v'(x)}{[v(x)]^2}$$

## What Happens (Worked Example)

**Product Rule Example**: $f(x) = x^2 \sin(x)$

Let $u = x^2$, $v = \sin(x)$. Then $u' = 2x$, $v' = \cos(x)$.
$$f'(x) = 2x \sin(x) + x^2 \cos(x)$$

**Quotient Rule Example**: $f(x) = \frac{x^2}{e^x}$

Let $u = x^2$, $v = e^x$. Then $u' = 2x$, $v' = e^x$.
$$f'(x) = \frac{2x \cdot e^x - x^2 \cdot e^x}{(e^x)^2} = \frac{e^x(2x - x^2)}{e^{2x}} = \frac{2x - x^2}{e^x}$$

## GATE MA Relevance

> **Why it matters in GATE MA:** Products and quotients of functions appear constantly. GATE asks: compute $f'(x)$ for $x e^x$, $x\sin(x)$, $\frac{x^2}{x+1}$. Often 1–2 marks. Combined with chain rule in complex expressions.
