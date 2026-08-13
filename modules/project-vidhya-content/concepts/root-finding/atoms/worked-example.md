---
id: root-finding-worked-example
concept_id: root-finding
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example: Newton-Raphson on $x^3 - x - 1 = 0$

**GATE-style problem:** Using the Newton-Raphson method, find the root of $f(x) = x^3 - x - 1 = 0$ near $x_0 = 1.5$. Perform **three iterations** and state the root to four decimal places.

---

## Setup

$$f(x) = x^3 - x - 1, \qquad f'(x) = 3x^2 - 1$$

The Newton-Raphson update formula is:

$$x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)} = x_n - \frac{x_n^3 - x_n - 1}{3x_n^2 - 1}$$

---

## Iteration 1 — $x_0 = 1.5$

$$f(1.5) = (1.5)^3 - 1.5 - 1 = 3.375 - 1.5 - 1 = \mathbf{0.875}$$

$$f'(1.5) = 3(1.5)^2 - 1 = 3(2.25) - 1 = 6.75 - 1 = \mathbf{5.75}$$

$$x_1 = 1.5 - \frac{0.875}{5.75} = 1.5 - 0.1522 = \mathbf{1.3478}$$

---

## Iteration 2 — $x_1 = 1.3478$

$$f(1.3478) = (1.3478)^3 - 1.3478 - 1$$

$(1.3478)^2 = 1.8166, \quad (1.3478)^3 = 1.3478 \times 1.8166 = 2.4483$

$$f(1.3478) = 2.4483 - 1.3478 - 1 = \mathbf{0.1005}$$

$$f'(1.3478) = 3(1.8166) - 1 = 5.4498 - 1 = \mathbf{4.4498}$$

$$x_2 = 1.3478 - \frac{0.1005}{4.4498} = 1.3478 - 0.0226 = \mathbf{1.3252}$$

---

## Iteration 3 — $x_2 = 1.3252$

$$f(1.3252) = (1.3252)^3 - 1.3252 - 1$$

$(1.3252)^2 = 1.7561, \quad (1.3252)^3 = 1.3252 \times 1.7561 = 2.3281$

$$f(1.3252) = 2.3281 - 1.3252 - 1 = \mathbf{0.0029}$$

$$f'(1.3252) = 3(1.7561) - 1 = 5.2683 - 1 = \mathbf{4.2683}$$

$$x_3 = 1.3252 - \frac{0.0029}{4.2683} = 1.3252 - 0.0007 = \mathbf{1.3245}$$

---

## Summary Table

| $n$ | $x_n$ | $f(x_n)$ | $f'(x_n)$ | $x_{n+1}$ |
|---|---|---|---|---|
| 0 | 1.5000 | 0.8750 | 5.7500 | 1.3478 |
| 1 | 1.3478 | 0.1005 | 4.4498 | 1.3252 |
| 2 | 1.3252 | 0.0029 | 4.2683 | 1.3245 |
| 3 | 1.3245 | $\approx 0$ | — | converged |

**Root $\approx 1.3247$** (exact to four decimal places).

---

## Convergence Observation

Notice how the residual $|f(x_n)|$ drops: $0.875 \to 0.1005 \to 0.0029 \to \approx 0$. Each iteration roughly **squares the previous error** — the hallmark of quadratic convergence. Bisection would have needed about $\log_2(0.5/10^{-4}) \approx 13$ iterations for the same accuracy.

---

## GATE Tip

In GATE, Newton-Raphson questions often ask:
- The **value after $k$ iterations** — compute each step carefully.
- The **order of convergence** — answer is 2 (quadratic) for simple roots.
- **When does NR fail?** — when $f'(x_n) = 0$ or the starting guess is far from the root.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"Write down the Newton-Raphson update formula specifically for f(x) = x³ − x − 1.","hint":"The general formula is x_{n+1} = x_n − f(x_n)/f′(x_n). Compute f′(x) = 3x² − 1 by differentiating f(x) = x³ − x − 1.","answer":"x_{n+1} = x_n − (x_n³ − x_n − 1) / (3x_n² − 1)"},{"prompt":"Starting from x₀ = 1.5, evaluate f(1.5) and f′(1.5), then find x₁.","hint":"f(1.5) = (1.5)³ − 1.5 − 1 = 3.375 − 2.5 = 0.875. f′(1.5) = 3(2.25) − 1 = 5.75. Then x₁ = 1.5 − 0.875/5.75.","answer":"x₁ = 1.5 − 0.1522 ≈ 1.3478"},{"prompt":"After three full iterations the root is approximately x ≈ ?  Also state the order of convergence of Newton-Raphson near a simple root.","hint":"Track x₀=1.5 → x₁≈1.3478 → x₂≈1.3252 → x₃≈1.3245. The residuals shrink quadratically: 0.875 → 0.1005 → 0.0029 → ≈0.","answer":"Root ≈ 1.3247; order of convergence = 2 (quadratic)"}]}
```
