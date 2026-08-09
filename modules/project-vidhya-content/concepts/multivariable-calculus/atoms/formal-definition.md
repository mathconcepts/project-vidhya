---
id: multivariable-calculus.formal-definition
concept_id: multivariable-calculus
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**Partial Derivative**: For $f(x, y)$, the partial derivative with respect to $x$ is:
$$\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x+h, y) - f(x, y)}{h}$$

(Treat $y$ as constant.)

**Gradient**: $\nabla f = (\frac{\partial f}{\partial x}, \frac{\partial f}{\partial y})$ points in the direction of steepest increase.

**Chain Rule for Multivariable**: If $z = f(x, y)$ and $x = x(t)$, $y = y(t)$:
$$\frac{dz}{dt} = \frac{\partial f}{\partial x} \frac{dx}{dt} + \frac{\partial f}{\partial y} \frac{dy}{dt}$$
