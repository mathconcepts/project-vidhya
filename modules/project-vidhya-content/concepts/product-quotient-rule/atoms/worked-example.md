---
id: product-quotient-rule-worked-example
concept_id: product-quotient-rule
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Product and Quotient Rule — Worked Example

## GATE-Style Problem

> **Differentiate** the following functions and simplify:
>
> **(A)** $f(x) = x^2 e^x$
>
> **(B)** $g(x) = \dfrac{\sin x}{x}$

---

## Part A: $f(x) = x^2 e^x$ — Product Rule

**Identify the factors:**

$$u = x^2, \quad v = e^x$$

**Find individual derivatives:**

$$u' = 2x, \quad v' = e^x$$

**Apply product rule** $f'= u'v + uv'$:

$$f'(x) = (2x)(e^x) + (x^2)(e^x)$$

**Factor out $e^x$:**

$$\boxed{f'(x) = e^x(2x + x^2) = x e^x(x + 2)}$$

> **GATE tip:** Always factor after differentiating — the answer in the options will usually be in factored form, and unfactored expressions will appear as distractors.

---

## Part B: $g(x) = \dfrac{\sin x}{x}$ — Quotient Rule

**Identify numerator and denominator (hi and lo):**

$$u = \sin x \quad (\text{hi}), \quad v = x \quad (\text{lo})$$

**Find individual derivatives:**

$$u' = \cos x, \quad v' = 1$$

**Apply quotient rule** $g' = \dfrac{u'v - uv'}{v^2}$:

$$g'(x) = \frac{(\cos x)(x) - (\sin x)(1)}{x^2}$$

$$\boxed{g'(x) = \frac{x\cos x - \sin x}{x^2}}$$

> This function $g(x) = \dfrac{\sin x}{x}$ is the **sinc function** — it appears frequently in signal processing and GATE problems involving limits and improper integrals. Note that $g'(x) \to 0$ as $x \to 0$ (verified by L'Hôpital or Taylor expansion).

---

## Common Error Check

**Wrong approach for Part A:**

$$f'(x) \overset{\times}{=} (2x)(e^x) = 2xe^x \quad \text{(forgot the second product rule term)}$$

**Wrong approach for Part B (sign error):**

$$g'(x) \overset{\times}{=} \frac{x\cos x + \sin x}{x^2} \quad \text{(plus instead of minus in numerator)}$$

The numerator of the quotient rule is always a **subtraction** — the denominator's derivative carries a minus sign.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"To differentiate f(x) = x²·eˣ using the product rule, what are u and v?","hint":"Identify the two factors being multiplied. Neither should be a constant.","answer":"u = x² and v = eˣ"},{"prompt":"What is u' (derivative of x²) and v' (derivative of eˣ)?","hint":"Power rule for x², and recall that eˣ is its own derivative.","answer":"u' = 2x and v' = eˣ"},{"prompt":"Apply the product rule f' = u'v + uv'. What is f'(x) before simplifying?","hint":"Substitute u=x², v=eˣ, u'=2x, v'=eˣ into the formula.","answer":"f'(x) = (2x)(eˣ) + (x²)(eˣ) = 2x·eˣ + x²·eˣ"},{"prompt":"Factor the result fully. What is the simplified form of f'(x)?","hint":"Both terms share a common factor of eˣ. Can you factor further?","answer":"f'(x) = eˣ(2x + x²) = x·eˣ(x + 2)"}]}
```
