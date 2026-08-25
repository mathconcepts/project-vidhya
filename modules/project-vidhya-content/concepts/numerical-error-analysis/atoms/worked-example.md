---
id: numerical-error-analysis.worked-example
concept_id: numerical-error-analysis
atom_type: worked_example
bloom_level: 3
difficulty: 0.32
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Error Measures and Propagation Through Arithmetic

## Problem (GATE-style)

**(a)** The true value of a quantity is $x_t = 25.0$, approximated as $x_a = 24.87$. Find the absolute error, relative error, and percentage error.

**(b)** Two quantities are measured as $p = 12.5 \pm 0.05$ and $q = 8.2 \pm 0.02$ (the $\pm$ values are the maximum absolute errors). Find the maximum absolute error in $p + q$, and the maximum absolute error and percentage error in $pq$.

---

## Solution

### Part (a): Error Measures

$$E_a = |x_t - x_a| = |25.0 - 24.87| = \boxed{0.13}$$

$$E_r = \frac{E_a}{|x_t|} = \frac{0.13}{25.0} = 0.0052$$

$$E_p = E_r \times 100\% = \boxed{0.52\%}$$

### Part (b): Propagation Through Sum and Product

**Sum $p + q$:** for addition, absolute errors add in the worst case:
$$E_a(p+q) \leq \delta p + \delta q = 0.05 + 0.02 = \boxed{0.07}$$
(with $p + q = 12.5 + 8.2 = 20.7$).

**Product $pq$:** for multiplication, relative errors approximately add. First find each relative error:
$$E_r(p) = \frac{0.05}{12.5} = 0.004, \qquad E_r(q) = \frac{0.02}{8.2} \approx 0.002439$$
$$E_r(pq) \approx E_r(p) + E_r(q) = 0.004 + 0.002439 = 0.006439 \implies E_p(pq) \approx \boxed{0.644\%}$$

Absolute error in the product: $pq = 12.5 \times 8.2 = 102.5$, so
$$E_a(pq) \approx E_r(pq) \times pq = 0.006439 \times 102.5 \approx \boxed{0.66}$$

**Cross-check** using the direct differential rule $d(pq) = p\,dq + q\,dp$ with the given maximum errors:
$$E_a(pq) \approx |p|\,\delta q + |q|\,\delta p = 12.5 \times 0.02 + 8.2 \times 0.05 = 0.25 + 0.41 = 0.66$$
Both methods agree: the maximum absolute error in $pq$ is $0.66$, matching the earlier calculation exactly.

---

## Key Insights

- **Relative error, not absolute error, is the "portable" measure** — it's what should be compared across quantities of different sizes, and it's the one that propagates cleanly through multiplication/division.
- **Errors in a sum never cancel in the worst-case bound**, even when the operation is a *subtraction* — always add the absolute errors of the two inputs.
- **The relative-error and differential (partial-derivative) methods for propagation through products always agree** — using both is a fast, reliable way to catch an arithmetic slip.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: propagating error through a product","steps":[{"prompt":"p = 12.5 ± 0.05 and q = 8.2 ± 0.02. For a PRODUCT pq, which quantity's errors approximately add — absolute or relative?","hint":"Multiplication/division propagate through RELATIVE error, not absolute error.","answer":"Relative errors approximately add: E_r(pq) ≈ E_r(p) + E_r(q)."},{"prompt":"Compute E_r(p) and E_r(q).","hint":"E_r = absolute error / true (or given) value.","answer":"E_r(p) = 0.05/12.5 = 0.004; E_r(q) = 0.02/8.2 ≈ 0.002439"},{"prompt":"Add them, then convert to an absolute error using pq = 102.5. What is the maximum absolute error in pq?","hint":"E_a(pq) ≈ E_r(pq) × pq.","answer":"E_r(pq) ≈ 0.006439, so E_a(pq) ≈ 0.006439 × 102.5 ≈ 0.66"}],"caption":"For products and quotients, propagate RELATIVE error; for sums and differences, propagate ABSOLUTE error — mixing the two up is the most common mistake in this topic."}
```
