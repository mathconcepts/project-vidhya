---
id: ode-higher-order.common-traps
concept_id: ode-higher-order
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Difficulty factoring the characteristic polynomial:** Many students struggle with cubic (or higher) polynomial factoring. Always try the rational root theorem first: if $ar^n + \ldots + a_0 = 0$, test rational roots $\pm \frac{p}{q}$ where $p$ divides the constant term and $q$ divides the leading coefficient.
- **Missing repeated root contributions:** When a root has multiplicity $m > 1$, students often write only a single exponential term instead of the full polynomial-exponential product. Remember: multiplicity 2 → factor is $(C_1 + C_2 x)e^{rx}$, not just $C_1 e^{rx}$.
- **Confusing the order of the ODE with the degree of the characteristic polynomial:** A 3rd-order ODE gives a cubic characteristic polynomial with 3 roots (counting multiplicity). A 4th-order ODE gives a quartic with 4 roots. The number of arbitrary constants in the general solution equals the number of roots.
