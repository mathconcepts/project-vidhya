---
id: numerical-integration.formal-definition
concept_id: numerical-integration
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**Simpson's 1/3 Rule**: For a function $f(x)$ on an interval $[a, b]$ divided into an even number of equal subintervals, the integral is approximated by:

$$\int_a^b f(x)\,dx \approx \frac{h}{3} \left[ f(x_0) + 4f(x_1) + 2f(x_2) + 4f(x_3) + \cdots + 2f(x_{n-2}) + 4f(x_{n-1}) + f(x_n) \right]$$

where $h = \frac{b-a}{n}$ (subinterval width) and $n$ is even. The formula interpolates the function over each pair of subintervals using a **parabola** (quadratic polynomial). The "1/3" factor comes from $\int_0^{2h} P_2(x)\,dx = \frac{h}{3}[y_0 + 4y_1 + y_2]$ where $P_2$ is the Lagrange interpolant through three points.
