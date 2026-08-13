---
id: numerical-integration-visual-analogy
concept_id: numerical-integration
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Measuring a Curved Field with Strips

Imagine you own a curved plot of land and you want to measure its area. You don't have calculus — just a ruler and some stakes.

---

## Trapezoidal Rule = Staking Straight Fences

Drive stakes at equally spaced points along the boundary. Connect adjacent stakes with *straight fence segments*. The area enclosed is a collection of trapezoids.

- **Accurate when:** the boundary is nearly straight between stakes (small $h$, or mildly curved land).
- **Error:** Each fence segment cuts corners from the true curve — the approximation undershoots on convex sections and overshoots on concave ones. The total error shrinks as $O(h^2)$: halve the stake spacing, cut the error by 4×.

---

## Simpson's Rule = Arching the Fences

Now, instead of a straight fence between every pair of stakes, you build a *parabolic arch* — you use **three** stakes at a time and fit the best-curving fence through them.

- **Accurate when:** the true boundary is smooth and well-approximated by parabolas (most exam functions).
- **Error:** Parabolic arches hug a smooth curve far better than straight lines. The error shrinks as $O(h^4)$: halve the stake spacing, cut the error by 16×.

**The surprise:** even though you only fitted *quadratic* arches, Simpson's rule happens to be *exact* for cubic boundaries too — a four-for-the-price-of-two deal.

---

## Visual: $f(x) = \dfrac{1}{1+x^2}$ on $[0, 4]$

This bell-shaped curve (the Cauchy/Lorentz density) has a large curved hump near $x = 0$ and a long tail. Straight-fence trapezoids waste accuracy on the hump; parabolic arches follow the curve much more faithfully.

$$\int_0^4 \frac{1}{1+x^2}\,dx = \arctan(4) \approx 1.3258$$

```gif-scene
{
  "type": "function-trace",
  "expression": "1 / (1 + x*x)",
  "x_range": [0, 4],
  "y_range": [0, 1.2],
  "label": "f(x)=1/(1+x²): area ≈ arctan(4) ≈ 1.3258"
}
```

---

## Stake Spacing = Step Size $h$

| Analogy | Numerics |
|---|---|
| Stakes | Nodes $x_0, x_1, \ldots, x_n$ |
| Gap between stakes | Step size $h = (b-a)/n$ |
| Straight fence | Trapezoidal rule |
| Parabolic arch | Simpson's 1/3 rule |
| Best-placed stakes | Gaussian quadrature nodes |

---

## Choosing Between Methods

- **Trapezoidal:** quick estimate; or when $f$ is known only at equally-spaced points.
- **Simpson's 1/3:** much better accuracy with the *same* number of function evaluations — prefer this for smooth $f$ with $n$ even.
- **Gaussian:** fewest evaluations for a given accuracy, but requires evaluation at non-equally-spaced (irrational) nodes — used when function evaluations are expensive.

**Rule of thumb for GATE:** If the problem says "use Simpson's rule with $n$ subintervals," always check that $n$ is even (for 1/3 rule) or divisible by 3 (for 3/8 rule).
