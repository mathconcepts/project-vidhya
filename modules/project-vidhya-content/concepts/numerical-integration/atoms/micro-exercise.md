---
id: numerical-integration.micro-exercise
concept_id: numerical-integration
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Approximate $\int_0^1 x^2\,dx$ using the trapezoidal rule with $n=2$ subintervals.

- **(A)** $I \approx 0.375$
- **(B)** $I \approx 0.3125$
- **(C)** $I \approx 0.25$
- **(D)** $I \approx 0.5$

<details>
<summary>Answer</summary>

**A**. Trapezoidal rule: $I \approx \frac{h}{2}[f(x_0) + 2f(x_1) + f(x_2)]$ where $h = \frac{b-a}{n} = \frac{1-0}{2} = 0.5$.

Nodes: $x_0 = 0$, $x_1 = 0.5$, $x_2 = 1$.
Function values: $f(0) = 0$, $f(0.5) = 0.25$, $f(1) = 1$.

$I \approx \frac{0.5}{2}[0 + 2(0.25) + 1] = \frac{0.5}{2}[0 + 0.5 + 1] = \frac{0.5}{2}(1.5) = 0.375$.

Exact: $\int_0^1 x^2\,dx = \frac{1}{3} \approx 0.333$. Error $\approx 0.042$.

</details>
