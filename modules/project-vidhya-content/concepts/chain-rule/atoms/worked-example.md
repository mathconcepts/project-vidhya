---
id: chain-rule-worked-example
concept_id: chain-rule
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Chain Rule — Worked Example

## GATE-Style Problem

> **Differentiate $y = e^{\cos(x)}$ with respect to $x$.**

This is a two-layer composition that appears regularly on GATE Engineering Mathematics. We apply the chain rule systematically.

---

## Step-by-Step Solution

**Step 1 — Identify the composite structure.**

Write $y = f(g(x))$ where:

- **Outer function:** $f(u) = e^u$
- **Inner function:** $g(x) = \cos(x)$

So $u = \cos(x)$ and $y = e^u$.

**Step 2 — Differentiate each layer separately.**

Derivative of the outer function:

$$\frac{dy}{du} = \frac{d}{du}(e^u) = e^u$$

Derivative of the inner function:

$$\frac{du}{dx} = \frac{d}{dx}(\cos x) = -\sin x$$

**Step 3 — Apply the chain rule: outer prime at inner, times inner prime.**

$$\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx} = e^u \cdot (-\sin x)$$

Substitute $u = \cos(x)$ back:

$$\boxed{\frac{dy}{dx} = -\sin(x)\, e^{\cos(x)}}$$

---

## Verification via a Second Method

Alternatively, write the chain rule in one line without introducing $u$:

$$\frac{d}{dx}\!\left[e^{g(x)}\right] = e^{g(x)} \cdot g'(x) = e^{\cos x} \cdot (-\sin x)$$

Same result. Experienced GATE solvers do this in one step.

---

## Extended Example: Three Layers

Differentiate $y = \ln(\sin(x^2))$.

Three gears: $x^2$ inside $\sin(\cdot)$ inside $\ln(\cdot)$.

$$\frac{dy}{dx} = \frac{1}{\sin(x^2)} \cdot \cos(x^2) \cdot 2x = \frac{2x\cos(x^2)}{\sin(x^2)} = 2x\cot(x^2)$$

---

## GATE Tip

On GATE, chain-rule problems often appear disguised as:

- Implicit differentiation (chain rule applied to $f(y) = g(x)$)
- Partial derivatives in multivariable questions
- Rate-of-change word problems with composed quantities

Whenever you see a function *inside* another function, the chain rule is active.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"For $y = e^{\\cos(x)}$, identify the outer function $f(u)$ and inner function $g(x)$. Write down their individual derivatives $f'(u)$ and $g'(x)$.","hint":"The outer function is whatever is 'applied last'. Here, $e^{\\square}$ is applied last, so $f(u) = e^u$. The inner function is $\\cos(x)$.","answer":"Outer: $f(u) = e^u$, so $f'(u) = e^u$. Inner: $g(x) = \\cos x$, so $g'(x) = -\\sin x$."},{"prompt":"Combine using the chain rule to find $\\frac{dy}{dx}$. Don't forget to substitute back $u = \\cos(x)$.","hint":"Chain rule: $\\frac{dy}{dx} = f'(g(x)) \\cdot g'(x)$. Evaluate $f'$ at the inner function, then multiply by the inner derivative.","answer":"$\\frac{dy}{dx} = e^{\\cos(x)} \\cdot (-\\sin x) = \\boxed{-\\sin(x)\\, e^{\\cos(x)}}$."}]}
```
