---
id: analytic-functions.common-traps
concept_id: analytic-functions
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Sign errors in Cauchy-Riemann**: Students often write $\frac{\partial u}{\partial y} = \frac{\partial v}{\partial x}$ instead of $\frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x}$ (forgetting the minus sign). The minus sign is critical — it encodes the 90° rotation property of complex multiplication.
- **Assuming continuity of partials implies analyticity**: Just because partial derivatives exist and are continuous does NOT guarantee Cauchy-Riemann holds. For example, $f(z) = |z|^2 = x^2 + y^2$ has continuous partials everywhere, but violates C-R except at the origin.
- **Confusing analytic with holomorphic**: In GATE, these terms are interchangeable. "Analytic" and "holomorphic" both mean "complex-differentiable." Don't be thrown off by terminology.
