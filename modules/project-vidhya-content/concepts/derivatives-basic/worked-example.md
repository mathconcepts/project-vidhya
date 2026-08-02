# Worked example — derivative of a product-times-composition

## Problem

Find the derivative of $f(x) = x^2 \sin(3x)$.

## Solution

**Step 1** — Recognize the structure.

We have a product of $u = x^2$ and $v = \sin(3x)$. The inner function $\sin(3x)$ is itself a composition of $\sin$ applied to $3x$, so we'll need both the product rule and the chain rule.

**Step 2** — Apply the product rule.

$$
(uv)' = u' v + u v'
$$

So $f'(x) = (x^2)' \cdot \sin(3x) + x^2 \cdot (\sin(3x))'$.

**Step 3** — Compute $u' = (x^2)'$.

Using the power rule: $u' = 2x$.

**Step 4** — Compute $v' = (\sin(3x))'$ using the chain rule.

Let the outer function be $\sin$ and the inner be $3x$. The chain rule gives:

$$
v' = \cos(3x) \cdot (3x)' = \cos(3x) \cdot 3 = 3\cos(3x)
$$

**Step 5** — Assemble.

$$
f'(x) = 2x \sin(3x) + x^2 \cdot 3\cos(3x) = 2x \sin(3x) + 3x^2 \cos(3x)
$$

## Answer

$$
f'(x) = 2x \sin(3x) + 3x^2 \cos(3x)
$$

## Why this problem

This is a canonical BITSAT-difficulty problem. It tests three things simultaneously:

1. **Rule recognition** — seeing that both product and chain rules are needed
2. **Chain-rule mechanics** — correctly differentiating the inner function $3x$
3. **Clean algebra** — not dropping the factor of 3 or conflating the two terms

Under exam time pressure, students typically lose marks on (2) — they write $\cos(3x)$ and forget the factor of 3 from the chain rule. If you caught that here, you're in good shape.

## Practice variations

Try these yourself, then check by differentiating again:

1. $f(x) = x^3 \cos(2x)$
2. $f(x) = x \sin(x^2)$
3. $f(x) = e^{2x} \cdot \ln(x)$

(Answers: (1) $3x^2 \cos(2x) - 2x^3 \sin(2x)$; (2) $\sin(x^2) + 2x^2 \cos(x^2)$; (3) $2e^{2x} \ln(x) + \frac{e^{2x}}{x}$)
