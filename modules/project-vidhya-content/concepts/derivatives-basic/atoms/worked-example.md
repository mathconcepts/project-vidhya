---
id: derivatives-basic-worked-example
concept_id: derivatives-basic
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example: Product Rule and Chain Rule

**Problem (GATE-style):** Find $\dfrac{dy}{dx}$ for

$$y = x^3 \ln(x) - e^{2x}\sin(x)$$

---

## Step 1 — Identify the Structure

The expression has **two terms** connected by subtraction. Differentiate term by term.

- **Term 1:** $x^3 \ln(x)$ — product of $x^3$ and $\ln x$ → use **Product Rule**
- **Term 2:** $e^{2x}\sin(x)$ — product of $e^{2x}$ and $\sin x$ → use **Product Rule**; note $e^{2x}$ also needs **Chain Rule**

## Step 2 — Differentiate Term 1: $x^3 \ln(x)$

Product Rule: $\dfrac{d}{dx}[u\,v] = u'v + uv'$

Let $u = x^3,\ v = \ln x$. Then $u' = 3x^2,\ v' = \dfrac{1}{x}$.

$$\frac{d}{dx}\!\left[x^3\ln x\right] = 3x^2 \cdot \ln x + x^3 \cdot \frac{1}{x} = 3x^2\ln x + x^2$$

## Step 3 — Differentiate Term 2: $e^{2x}\sin(x)$

Let $u = e^{2x},\ v = \sin x$.

- $u' = 2e^{2x}$ (Chain Rule: outer $e^{(\cdot)}$ times inner derivative $2$)
- $v' = \cos x$

$$\frac{d}{dx}\!\left[e^{2x}\sin x\right] = 2e^{2x}\sin x + e^{2x}\cos x = e^{2x}(2\sin x + \cos x)$$

## Step 4 — Combine

$$\frac{dy}{dx} = \left(3x^2\ln x + x^2\right) - e^{2x}(2\sin x + \cos x)$$

$$\boxed{\frac{dy}{dx} = x^2(3\ln x + 1) - e^{2x}(2\sin x + \cos x)}$$

---

## Bonus: $n$-th Derivative of $\sin(ax + b)$

A common GATE pattern asks for $\dfrac{d^n}{dx^n}\!\left[\sin(ax+b)\right]$.

Each differentiation multiplies by $a$ (chain rule) and advances the phase by $\pi/2$:

$$\frac{d}{dx}\sin(ax+b) = a\cos(ax+b) = a\sin\!\left(ax+b+\frac{\pi}{2}\right)$$

$$\frac{d^2}{dx^2}\sin(ax+b) = a^2\sin\!\left(ax+b+\pi\right)$$

After $n$ differentiations:

$$\frac{d^n}{dx^n}\left[\sin(ax+b)\right] = a^n \sin\!\left(ax + b + \frac{n\pi}{2}\right)$$

**Example:** $\dfrac{d^3}{dx^3}\!\left[\sin(3x)\right] = 3^3\sin\!\left(3x + \dfrac{3\pi}{2}\right) = 27\sin\!\left(3x+\dfrac{3\pi}{2}\right) = -27\cos(3x)$.

---

## Common GATE Errors to Avoid

| Mistake | Correct approach |
|---|---|
| $\frac{d}{dx}[e^{2x}] = e^{2x}$ (forgetting chain rule) | $= 2e^{2x}$ |
| $\frac{d}{dx}[\ln x] = \frac{1}{x^2}$ | $= \frac{1}{x}$ |
| Applying product rule as $(uv)' = u'v'$ | Must be $u'v + uv'$ |

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: product and chain rule on x^3 ln(x) - e^(2x) sin(x)","steps":[{"prompt":"Which differentiation rule applies to x^3·ln(x), and what are u and v?","hint":"When a function is a product of two distinct functions, use the Product Rule: (uv)' = u'v + uv'.","answer":"Product Rule. Let u = x^3 (so u' = 3x^2) and v = ln(x) (so v' = 1/x)."},{"prompt":"What is the derivative of e^(2x)? Which rule do you need beyond the basic exponential rule?","hint":"e^(2x) is a composite function: the outer function is e^(·) and the inner function is 2x.","answer":"Chain Rule gives d/dx[e^(2x)] = e^(2x)·2 = 2e^(2x). The factor 2 comes from differentiating the inner function 2x."},{"prompt":"State the final answer for dy/dx in fully simplified form.","hint":"Combine both differentiated terms, remembering to subtract the second term as it appears with a minus sign in the original y.","answer":"dy/dx = x^2(3 ln x + 1) - e^(2x)(2 sin x + cos x). Factor x^2 from the first part and e^(2x) from the second."}]}
```
