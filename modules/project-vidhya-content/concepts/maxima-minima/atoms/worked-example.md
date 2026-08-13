---
id: maxima-minima-worked-example
concept_id: maxima-minima
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Maxima and Minima — Worked Example

## GATE-Style Problem

> Find the **absolute maximum** and **absolute minimum** values of
>
> $$f(x) = x^3 - 3x^2 + 4 \quad \text{on} \quad [-1,\, 3]$$

---

## Step 1: Find the Derivative

$$f'(x) = 3x^2 - 6x = 3x(x - 2)$$

---

## Step 2: Find Critical Points Inside $(-1, 3)$

Set $f'(x) = 0$:

$$3x(x - 2) = 0 \implies x = 0 \quad \text{or} \quad x = 2$$

Both $x = 0$ and $x = 2$ lie in the open interval $(-1, 3)$. ✓

Check that $f'$ exists everywhere on $[-1, 3]$: yes, $f'$ is a polynomial. So there are **no other critical points**.

---

## Step 3: Evaluate $f$ at Critical Points and Endpoints

| $x$ | $f(x) = x^3 - 3x^2 + 4$ | Type |
|---|---|---|
| $x = -1$ | $(-1)^3 - 3(-1)^2 + 4 = -1 - 3 + 4 = \mathbf{0}$ | Left endpoint |
| $x = 0$ | $0 - 0 + 4 = \mathbf{4}$ | Critical point |
| $x = 2$ | $8 - 12 + 4 = \mathbf{0}$ | Critical point |
| $x = 3$ | $27 - 27 + 4 = \mathbf{4}$ | Right endpoint |

---

## Step 4: Identify the Absolute Extrema

Comparing all values: $\{0,\, 4,\, 0,\, 4\}$

$$\boxed{\text{Absolute maximum} = 4, \text{ achieved at } x = 0 \text{ and } x = 3}$$

$$\boxed{\text{Absolute minimum} = 0, \text{ achieved at } x = -1 \text{ and } x = 2}$$

> **GATE watchpoint:** The maximum is achieved at **two** points — one interior critical point and one endpoint. Examiners sometimes ask "at what value of $x$?" to check whether you realize both count. Always report all $x$ values where the extremum is achieved.

---

## Confirming with the Second Derivative Test

$$f''(x) = 6x - 6$$

- At $x = 0$: $f''(0) = -6 < 0$ → **local maximum** (confirms the value $4$ is a local peak)
- At $x = 2$: $f''(2) = +6 > 0$ → **local minimum** (confirms the value $0$ is a local valley)

The second derivative test agrees with our table.

---

## What Would Change on an Open Interval?

On the open interval $(-1, 3)$, we'd say:
- Local max: $f(0) = 4$
- Local min: $f(2) = 0$
- **No** absolute max or min can be claimed (the closed interval endpoints are excluded, and the function approaches those values but the "achieved" qualifier fails)

The closed interval is what makes absolute extrema definitive — this is why GATE problems specify $[a, b]$.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"Find f'(x) for f(x) = x³ − 3x² + 4.","hint":"Differentiate term by term using the power rule: d/dx[xⁿ] = n·xⁿ⁻¹.","answer":"f'(x) = 3x² − 6x"},{"prompt":"Set f'(x) = 0 and find the critical points. Factor 3x² − 6x first.","hint":"Factor out 3x from 3x² − 6x to get 3x(x − 2) = 0.","answer":"x = 0 and x = 2"},{"prompt":"Which candidates must you evaluate on the closed interval [−1, 3]?","hint":"The closed interval method requires critical points inside the interval PLUS both endpoints.","answer":"x = −1, x = 0, x = 2, and x = 3 (two critical points plus both endpoints)"},{"prompt":"Evaluate f at all four candidates and state the absolute maximum and minimum values.","hint":"f(−1)=0, f(0)=4, f(2)=0, f(3)=4. Compare all four values.","answer":"Absolute maximum = 4 (at x=0 and x=3); Absolute minimum = 0 (at x=−1 and x=2)"}]}
```
