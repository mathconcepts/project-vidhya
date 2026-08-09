---
id: ode-first-order.formal-definition
concept_id: ode-first-order
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**Standard First-Order ODE Form**: An equation of the form $\frac{dy}{dx} = f(x, y)$ where the derivative of $y$ with respect to $x$ depends on both $x$ and $y$. The solution $y(x)$ is a family of curves, each determined by an initial condition $y(x_0) = y_0$.

**Separable ODE** (most common): If the equation can be written as $\frac{dy}{dx} = g(x) h(y)$, separate variables:
$$\frac{dy}{h(y)} = g(x) \, dx$$
Integrate both sides to find the solution.
