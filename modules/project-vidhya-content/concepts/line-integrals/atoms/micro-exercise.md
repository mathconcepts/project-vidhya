---
id: line-integrals.micro-exercise
concept_id: line-integrals
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Evaluate $\int_C (x^2 + y) dx + xy \, dy$ where $C$ is the line segment from $(0, 0)$ to $(2, 1)$. Parameterize: $x = 2t$, $y = t$ for $t \in [0, 1]$.

- **(A)** 2
- **(B)** 3
- **(C)** $\frac{13}{3}$
- **(D)** 5

<details>
<summary>Answer</summary>

**C**. Substitute the parameterization $x = 2t$, $y = t$:

$dx = 2 \, dt$, $dy = 1 \, dt$

Rewrite the integral:
$$\int_0^1 [(2t)^2 + t](2) + (2t)(t) \, dt = \int_0^1 [2(4t^2 + t) + 2t^2] \, dt$$

$$= \int_0^1 [8t^2 + 2t + 2t^2] \, dt = \int_0^1 [10t^2 + 2t] \, dt$$

$$= \left[\frac{10t^3}{3} + t^2\right]_0^1 = \frac{10}{3} + 1 = \boxed{\frac{13}{3}}$$

Check: $\frac{13}{3}\approx4.33$, and the two terms $\frac{10}{3}\approx3.33$ and $1$ sum to that — consistent with the positive integrand $10t^2+2t\geq0$ on $[0,1]$.

</details>
