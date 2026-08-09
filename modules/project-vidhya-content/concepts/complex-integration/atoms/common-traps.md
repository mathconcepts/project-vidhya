---
id: complex-integration.common-traps
concept_id: complex-integration
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting to check if poles are inside the contour**: Students often write down $2\pi i \cdot f(z_0)$ without verifying that $z_0$ actually lies inside the contour. If it's outside, the integral is zero by Cauchy's theorem.
- **Incorrectly applying Cauchy's formula to non-analytic integrands**: Cauchy's formula $\oint_C \frac{f(z)}{z - z_0} dz = 2\pi i f(z_0)$ only works if $f$ is analytic inside and on $C$. If the integrand has other singularities inside, you need residue calculus instead.
- **Confusing pole order**: A simple pole at $z_0$ gives $2\pi i \cdot (\text{residue})$. A pole of order 2 requires the derivative formula: $2\pi i \cdot f'(z_0)$. Students often use the simple formula for all pole orders.
