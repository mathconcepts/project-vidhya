---
id: complex-integration.common-traps
concept_id: complex-integration
atom_type: common_traps
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
---

**Trap 1 — Forgetting to check if poles are inside the contour.** Students often write $2\pi i\cdot f(z_0)$ without verifying $z_0$ actually lies inside $C$. Outside, the integral is zero by Cauchy's theorem, not the formula's value.

**Trap 2 — Applying Cauchy's formula to a non-single-pole integrand.** $\oint_C\frac{f(z)}{z-z_0}dz=2\pi i\,f(z_0)$ needs $f$ analytic inside and on $C$ — if the integrand has other singularities inside, split by partial fractions first, or use residue calculus instead.

**Trap 3 — Confusing pole order.** A simple pole at $z_0$ gives $2\pi i\cdot(\text{residue})$. A pole of order 2 needs the derivative formula, $2\pi i\cdot f'(z_0)$ for $f(z)/(z-z_0)^2$. Using the simple-pole formula on a higher-order pole gives the wrong answer.
