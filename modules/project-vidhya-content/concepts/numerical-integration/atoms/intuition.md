---
id: numerical-integration-intuition
concept_id: numerical-integration
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Numerical Integration

When an integrand has no closed-form antiderivative — or is known only at discrete points — we approximate $\int_a^b f(x)\,dx$ by a weighted sum of function values.

---

## Step Size and Nodes

Divide $[a, b]$ into $n$ equal subintervals of width:

$$h = \frac{b - a}{n}$$

Nodes: $x_i = a + ih$ for $i = 0, 1, \ldots, n$.

---

## Trapezoidal Rule

**Idea:** Approximate $f$ on each subinterval by a straight line (trapezoid).

$$\int_a^b f(x)\,dx \approx \frac{h}{2}\left[f(x_0) + 2f(x_1) + 2f(x_2) + \cdots + 2f(x_{n-1}) + f(x_n)\right]$$

**Weights:** $\frac{h}{2}$ × $[1, 2, 2, \ldots, 2, 1]$.

**Error:** $O(h^2)$ — specifically, the global truncation error is $-\frac{(b-a)h^2}{12}f''(\xi)$ for some $\xi \in (a,b)$.

---

## Simpson's 1/3 Rule

**Idea:** Fit a *parabola* through each group of three consecutive nodes. Requires $n$ even.

$$\int_a^b f(x)\,dx \approx \frac{h}{3}\left[f(x_0) + 4f(x_1) + 2f(x_2) + 4f(x_3) + \cdots + 4f(x_{n-1}) + f(x_n)\right]$$

**Weights:** $\frac{h}{3}$ × $[1, 4, 2, 4, 2, \ldots, 4, 1]$ — the pattern alternates $4, 2$ for interior nodes.

**Error:** $O(h^4)$ — specifically $-\frac{(b-a)h^4}{180}f^{(4)}(\xi)$.

Simpson's rule is *exact* for polynomials up to degree 3, even though it uses only degree-2 approximants (a happy accident called super-convergence).

---

## Simpson's 3/8 Rule

Uses groups of four nodes; requires $n$ divisible by 3.

$$\int_a^b f(x)\,dx \approx \frac{3h}{8}\left[f(x_0) + 3f(x_1) + 3f(x_2) + 2f(x_3) + 3f(x_4) + \cdots + f(x_n)\right]$$

**Error:** Same order $O(h^4)$ as Simpson's 1/3.

---

## Richardson Extrapolation

If $I(h)$ is an approximation with error $O(h^p)$, use two step sizes $h$ and $h/2$ to cancel the leading error term:

$$I_{\text{improved}} = \frac{2^p\,I(h/2) - I(h)}{2^p - 1}$$

For the trapezoidal rule ($p=2$): $I_{\text{improved}} = \frac{4I(h/2) - I(h)}{3}$ — this is exactly Simpson's rule.

---

## Gaussian Quadrature

**Idea:** Choose both the *weights* $w_i$ and the *nodes* $x_i$ optimally (they need not be equally spaced). An $n$-point Gaussian rule integrates polynomials of degree up to $2n-1$ exactly.

For $[-1, 1]$ with 2 points: nodes at $\pm 1/\sqrt{3}$, weights $1$ each.

$$\int_{-1}^{1} f(x)\,dx \approx f\!\left(-\tfrac{1}{\sqrt{3}}\right) + f\!\left(\tfrac{1}{\sqrt{3}}\right)$$

Transform to $[a, b]$ via $x = \frac{b+a}{2} + \frac{b-a}{2}t$.

---

## Accuracy Comparison (GATE Quick Reference)

| Method | Error | Requires $n$ | Exact for degree |
|---|---|---|---|
| Trapezoidal | $O(h^2)$ | any | $\leq 1$ |
| Simpson's 1/3 | $O(h^4)$ | even | $\leq 3$ |
| Simpson's 3/8 | $O(h^4)$ | mult. of 3 | $\leq 3$ |
| $n$-pt Gaussian | exponential | — | $\leq 2n-1$ |

**Key GATE insight:** Simpson's rule uses the same number of function evaluations as the trapezoidal rule (for the same $h$) but achieves $O(h^4)$ accuracy instead of $O(h^2)$ — two orders of magnitude better for smooth functions.
