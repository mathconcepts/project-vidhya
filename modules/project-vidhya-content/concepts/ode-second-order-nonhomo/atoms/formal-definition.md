---
id: ode-second-order-nonhomo.formal-definition
concept_id: ode-second-order-nonhomo
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**Standard Second-Order Non-Homogeneous Linear ODE** (constant coefficients):
$$a\frac{d^2y}{dx^2} + b\frac{dy}{dx} + cy = f(x)$$
where $f(x) \neq 0$ is the non-homogeneous term.

**General Solution Structure**:
$$y(x) = y_h(x) + y_p(x)$$
where:
- $y_h(x)$ is the **homogeneous solution** (solves $a\frac{d^2y}{dx^2} + b\frac{dy}{dx} + cy = 0$)
- $y_p(x)$ is a **particular solution** (any solution to the full non-homogeneous equation)

**Particular Solution Methods**:
1. **Method of Undetermined Coefficients**: Guess a form for $y_p$ based on $f(x)$, then solve for the coefficients.
2. **Variation of Parameters**: Use the homogeneous solutions $y_1, y_2$ to construct $y_p$ via integration.
