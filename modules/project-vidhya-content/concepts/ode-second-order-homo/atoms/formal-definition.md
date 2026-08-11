---
id: ode-second-order-homo.formal-definition
concept_id: ode-second-order-homo
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Standard Second-Order Homogeneous Linear ODE** (constant coefficients):
$$a\frac{d^2y}{dx^2} + b\frac{dy}{dx} + cy = 0$$
where $a, b, c$ are constants and $a \neq 0$.

**Characteristic Equation**: Replace $\frac{d^2y}{dx^2}$ with $r^2$, $\frac{dy}{dx}$ with $r$, and $y$ with 1:
$$ar^2 + br + c = 0$$

**Solutions depend on the roots** $r_1, r_2$:
1. **Distinct real roots** ($r_1 \neq r_2$): $y(x) = C_1 e^{r_1 x} + C_2 e^{r_2 x}$
2. **Repeated root** ($r_1 = r_2 = r$): $y(x) = (C_1 + C_2 x) e^{rx}$
3. **Complex conjugate roots** ($r = \alpha \pm i\beta$): $y(x) = e^{\alpha x}(C_1 \cos(\beta x) + C_2 \sin(\beta x))$
