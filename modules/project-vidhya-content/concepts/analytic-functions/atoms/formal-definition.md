---
id: analytic-functions.formal-definition
concept_id: analytic-functions
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Cauchy-Riemann Equations**: A complex function $f(z) = u(x, y) + iv(x, y)$ (where $u, v$ are real-valued functions of real variables $x, y$) is **analytic** in a region $D$ if it is differentiable at every point in $D$. This is equivalent to the **Cauchy-Riemann equations** holding:

$$\frac{\partial u}{\partial x} = \frac{\partial v}{\partial y} \quad \text{and} \quad \frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x}$$

When these hold and all partial derivatives are continuous, the complex derivative exists and equals:
$$f'(z) = \frac{\partial u}{\partial x} + i\frac{\partial v}{\partial x}$$
