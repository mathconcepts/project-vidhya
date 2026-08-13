---
id: interpolation.intuition
concept_id: interpolation
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

## Interpolation: Filling in the Gaps

Imagine you have discrete measurements of a physical process—temperature readings at specific times, or stress values at particular positions in a material. But your analysis needs values *between* these measurements. **Interpolation** is the technique of constructing a continuous function that passes through all your known data points, so you can estimate unknown intermediate values.

The core idea is simple: if you have $n$ data points, you can fit a polynomial of degree at most $n-1$ that passes exactly through all of them. This polynomial then approximates the true underlying relationship between your variables.

In numerical methods, interpolation serves three key purposes:
1. **Estimate missing values** — Find $f(x)$ at points not in your dataset
2. **Differentiate or integrate** — Approximate derivatives and integrals using the fitted polynomial
3. **Replace expensive functions** — Use a cheap polynomial fit instead of repeated evaluations of a costly function

The three main interpolation methods—**Lagrange**, **Newton divided differences**, and **Splines**—each offer trade-offs between simplicity, computational cost, and robustness. Lagrange is intuitive but can be inefficient for large datasets. Newton divided differences are progressive and elegant. Splines avoid oscillation by using low-degree pieces instead of one global polynomial.

In GATE exams, interpolation questions typically ask you to evaluate at an intermediate point or analyze error bounds.
```

### File 2:
