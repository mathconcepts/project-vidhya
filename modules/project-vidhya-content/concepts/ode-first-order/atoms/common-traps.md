---
id: ode-first-order.common-traps
concept_id: ode-first-order
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting the constant of integration ($C$):** Many students write $\ln y = 3x$ and jump to $y = e^{3x}$, missing the $+C$ inside the exponent. The correct form is $y = Ae^{3x}$ where $A = e^C$.
- **Misapplying initial conditions:** Students find the general solution but then fail to substitute the initial condition correctly, or forget to solve for $C$ before claiming the answer is complete.
- **Assuming separation is always possible:** Not every first-order ODE is separable. For example, $\frac{dy}{dx} = x + y$ cannot be separated—these require integrating factors or other methods.
