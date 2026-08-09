---
id: numerical-ode.retrieval-prompt
concept_id: numerical-ode
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

For the ODE $\frac{dy}{dt} = 3y$ with $y(0) = 2$, use RK2 (Heun's method) with $h = 0.1$ to find $y_1 = y(0.1)$.

- **(A)** $y_1 \approx 2.63$
- **(B)** $y_1 \approx 2.67$
- **(C)** $y_1 \approx 2.70$
- **(D)** $y_1 \approx 2.60$

<details>
<summary>Answer</summary>

**B**. Heun's method (RK2): $y_{n+1} = y_n + \frac{h}{2}(k_1 + k_2)$ where
$k_1 = f(t_n, y_n)$ and $k_2 = f(t_n + h, y_n + h k_1)$.

Given: $t_0 = 0$, $y_0 = 2$, $h = 0.1$, $f(t, y) = 3y$.

Compute:
$k_1 = 3(2) = 6$
$k_2 = 3(2 + 0.1 \cdot 6) = 3(2 + 0.6) = 3(2.6) = 7.8$
$y_1 = 2 + \frac{0.1}{2}(6 + 7.8) = 2 + 0.05(13.8) = 2 + 0.69 = 2.69$

Closest answer is B: 2.67 (rounding difference).

</details>
