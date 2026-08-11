---
id: ode-first-order.micro-exercise
concept_id: ode-first-order
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Solve the separable ODE $\frac{dy}{dx} = 3y$ with initial condition $y(0) = 2$.

- **(A)** $y = 2e^{3x}$
- **(B)** $y = e^{3x}$
- **(C)** $y = 3e^{2x}$
- **(D)** $y = 2e^{x/3}$

<details>
<summary>Answer</summary>

**A**. **Step 1:** Separate variables.
$$\frac{dy}{y} = 3 \, dx$$

**Step 2:** Integrate both sides.
$$\int \frac{dy}{y} = \int 3 \, dx$$
$$\ln|y| = 3x + C$$

**Step 3:** Exponentiate.
$$y = Ae^{3x}$$

**Step 4:** Apply initial condition $y(0) = 2$.
$$2 = A e^{0} = A$$

**Solution:** $y = 2e^{3x}$. This represents exponential growth; the population doubles and then grows by a factor of $e^3 \approx 20$ per unit increase in $x$.

</details>
