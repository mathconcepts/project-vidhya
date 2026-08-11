---
id: ode-second-order-homo.common-traps
concept_id: ode-second-order-homo
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Mixing up solution forms for different root cases:** Many students write $y(x) = C_1 e^{r_1 x} + C_2 e^{r_2 x}$ even for repeated or complex roots. Remember: each case has a different form. Repeated roots get a factor of $(C_1 + C_2 x)$. Complex roots become sines and cosines.
- **Sign errors in the characteristic equation:** When writing $ar^2 + br + c = 0$, students sometimes flip signs or miscopy coefficients from the original ODE. Double-check by substitution: plug $y = e^{rx}$ back into the ODE to verify the characteristic equation.
- **Forgetting to include the exponential envelope for complex roots:** For complex roots $r = \alpha \pm i\beta$, the solution is $e^{\alpha x}(\ldots)$, not just $(\ldots)$. If $\alpha = 0$, it simplifies to pure oscillation, but the factor is still there.
