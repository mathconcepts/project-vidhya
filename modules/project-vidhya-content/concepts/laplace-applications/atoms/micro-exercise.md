---
id: laplace-applications.micro-exercise
concept_id: laplace-applications
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Using Laplace transforms, solve the ODE $\frac{dy}{dt} + 2y = 0$ with initial condition $y(0) = 5$.

- **(A)** $y(t) = 5e^{-2t}$
- **(B)** $y(t) = 5e^{2t}$
- **(C)** $y(t) = e^{-2t}$
- **(D)** $y(t) = 5e^{-t}$

<details>
<summary>Answer</summary>

**A**. Transform both sides: $\mathcal{L}\left\{\frac{dy}{dt}\right\} + 2\mathcal{L}\{y\} = 0$. Using $\mathcal{L}\left\{\frac{dy}{dt}\right\} = sY(s) - y(0) = sY(s) - 5$: $(sY(s) - 5) + 2Y(s) = 0 \Rightarrow (s+2)Y(s) = 5 \Rightarrow Y(s) = \frac{5}{s+2}$. Inverse transform: $y(t) = 5e^{-2t}$. The pole at $s=-2$ encodes the exponential decay rate of 2.

</details>
