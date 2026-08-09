---
id: ode-higher-order.formal-definition
concept_id: ode-higher-order
atom_type: formal_definition
bloom_level: 2
difficulty: 0.56
exam_ids: ["*"]
---

**General $n$-th Order Linear ODE** (constant coefficients, homogeneous):
$$a_n \frac{d^ny}{dx^n} + a_{n-1} \frac{d^{n-1}y}{dx^{n-1}} + \cdots + a_1 \frac{dy}{dx} + a_0 y = 0$$

**Characteristic Equation**:
$$a_n r^n + a_{n-1} r^{n-1} + \cdots + a_1 r + a_0 = 0$$

**General Solution** (combining all roots):
- **Real root $r$** (multiplicity $m$): contributes $(C_1 + C_2 x + \cdots + C_m x^{m-1}) e^{rx}$
- **Complex conjugate pair $\alpha \pm i\beta$** (multiplicity $m$): contributes $e^{\alpha x}[(A_1 + A_2 x + \cdots + A_m x^{m-1})\cos(\beta x) + (B_1 + B_2 x + \cdots + B_m x^{m-1})\sin(\beta x)]$
