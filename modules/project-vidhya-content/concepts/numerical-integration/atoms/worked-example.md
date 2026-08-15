---
id: numerical-integration-worked-example
concept_id: numerical-integration
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example: Simpson's 1/3 Rule for $\int_0^1 \frac{1}{1+x}\,dx$

**GATE-style problem:** Using Simpson's 1/3 rule with $n = 4$ equal subintervals, approximate $\displaystyle\int_0^1 \frac{dx}{1+x}$. Compare with the exact value and compute the absolute error.

---

## Step 1 — Set Up Nodes and Step Size

$$h = \frac{b - a}{n} = \frac{1 - 0}{4} = 0.25$$

| $i$ | $x_i$ | $f(x_i) = \dfrac{1}{1+x_i}$ |
|---|---|---|
| 0 | 0.00 | $1/1.00 = 1.0000$ |
| 1 | 0.25 | $1/1.25 = 0.8000$ |
| 2 | 0.50 | $1/1.50 = 0.\overline{6} \approx 0.6667$ |
| 3 | 0.75 | $1/1.75 = 4/7 \approx 0.5714$ |
| 4 | 1.00 | $1/2.00 = 0.5000$ |

---

## Step 2 — Apply Simpson's 1/3 Formula

$$\int_0^1 \frac{dx}{1+x} \approx \frac{h}{3}\bigl[f_0 + 4f_1 + 2f_2 + 4f_3 + f_4\bigr]$$

Substitute:

$$= \frac{0.25}{3}\bigl[1.0000 + 4(0.8000) + 2(0.6667) + 4(0.5714) + 0.5000\bigr]$$

$$= \frac{0.25}{3}\bigl[1.0000 + 3.2000 + 1.3334 + 2.2857 + 0.5000\bigr]$$

$$= \frac{0.25}{3}\times 8.3191$$

$$= \frac{0.25}{3}\times 8.3191 = 0.08\overline{3} \times 8.3191 \approx \mathbf{0.6933}$$

---

## Step 3 — Compare with Exact Value

$$\int_0^1 \frac{dx}{1+x} = \bigl[\ln(1+x)\bigr]_0^1 = \ln 2 - \ln 1 = \ln 2 \approx 0.6931$$

$$\text{Absolute error} = |0.6933 - 0.6931| = \mathbf{0.0002}$$

$$\text{Relative error} = \frac{0.0002}{0.6931} \approx 0.029\%$$

---

## Error Analysis

The theoretical global error for Simpson's 1/3 rule is:

$$E = -\frac{(b-a)h^4}{180}\,f^{(4)}(\xi), \quad \xi \in (0,1)$$

For $f(x) = (1+x)^{-1}$:

$$f^{(4)}(x) = \frac{24}{(1+x)^5}$$

Maximum on $[0,1]$ is at $x=0$: $f^{(4)}(0) = 24$. So:

$$|E| \leq \frac{1 \times (0.25)^4}{180} \times 24 = \frac{0.003906 \times 24}{180} \approx 0.00052$$

Our measured error $0.0002$ is well within this bound. ✓

---

## Summary

| Quantity | Value |
|---|---|
| Approximation (Simpson's, $n=4$) | $0.6933$ |
| Exact ($\ln 2$) | $0.6931$ |
| Absolute error | $0.0002$ |
| Error order | $O(h^4) = O(0.25^4) = O(0.0039)$ |

**GATE tip:** With the same four subintervals, the trapezoidal rule gives $\approx 0.6970$ (error $\approx 0.0039$) — about **20 times larger**. Simpson's 1/3 is far more accurate for the same computational cost.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Simpson's 1/3 rule for ∫₀¹ 1/(1+x) dx","steps":[{"prompt":"For Simpson's 1/3 rule applied to ∫₀¹ 1/(1+x) dx with n=4, state the step size h and list all five nodes x₀ through x₄.","hint":"h = (b−a)/n = (1−0)/4 = 0.25. The nodes are x_i = 0 + i·h for i = 0, 1, 2, 3, 4.","answer":"h = 0.25; nodes are x₀=0, x₁=0.25, x₂=0.5, x₃=0.75, x₄=1"},{"prompt":"Evaluate f(xᵢ) = 1/(1+xᵢ) at each node and write the Simpson's 1/3 weighted sum [f₀ + 4f₁ + 2f₂ + 4f₃ + f₄].","hint":"f values: 1.0000, 0.8000, 0.6667, 0.5714, 0.5000. Weights for interior nodes alternate 4, 2, 4 (endpoints weight 1 each).","answer":"1.0000 + 4(0.8000) + 2(0.6667) + 4(0.5714) + 0.5000 = 1 + 3.2 + 1.3334 + 2.2857 + 0.5 = 8.3191"},{"prompt":"Complete the approximation and find the absolute error given that the exact value is ln 2 ≈ 0.6931.","hint":"Multiply the weighted sum by h/3 = 0.25/3 ≈ 0.08333. Then |approx − exact| gives the error.","answer":"(0.25/3) × 8.3191 ≈ 0.6933; absolute error = |0.6933 − 0.6931| ≈ 0.0002"}]}
```
