---
id: numerical-ode.micro-exercise
concept_id: numerical-ode
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Using Euler's method with step size $h = 0.1$, approximate $y(0.1)$ for the ODE $\frac{dy}{dt} = t + y$ with $y(0) = 1$.

- **(A)** $y_1 \approx 1.1$
- **(B)** $y_1 \approx 1.2$
- **(C)** $y_1 \approx 1.15$
- **(D)** $y_1 \approx 1.05$

<details>
<summary>Answer</summary>

**A**. Euler's method: $y_{n+1} = y_n + h \cdot f(t_n, y_n)$.

Given: $t_0 = 0$, $y_0 = 1$, $h = 0.1$, $f(t, y) = t + y$.

Compute: $y_1 = y_0 + h \cdot f(t_0, y_0) = 1 + 0.1 \cdot (0 + 1) = 1 + 0.1 = 1.1$.

</details>
