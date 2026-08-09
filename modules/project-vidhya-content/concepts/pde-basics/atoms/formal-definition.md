---
id: pde-basics.formal-definition
concept_id: pde-basics
atom_type: formal_definition
bloom_level: 2
difficulty: 0.56
exam_ids: ["*"]
---

**Partial Differential Equation (PDE)** Standard form involves at least two independent variables (e.g., $x$ and $t$) and partial derivatives:
$$F\left(x, t, u, \frac{\partial u}{\partial x}, \frac{\partial u}{\partial t}, \frac{\partial^2 u}{\partial x^2}, \ldots \right) = 0$$

**Order**: The highest derivative order appearing in the PDE.

**Linearity**: A PDE is linear if $u$ and its partial derivatives appear to the first power only (no products, no $u^2$, etc.).

**Three canonical PDEs** (most common in GATE):
1. **Heat (Diffusion) Equation** (parabolic): $\frac{\partial u}{\partial t} = k \frac{\partial^2 u}{\partial x^2}$
2. **Wave Equation** (hyperbolic): $\frac{\partial^2 u}{\partial t^2} = c^2 \frac{\partial^2 u}{\partial x^2}$
3. **Laplace Equation** (elliptic): $\frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2} = 0$ (steady-state)

**Method of Separation of Variables** (most practical for GATE):
Assume $u(x, t) = X(x) T(t)$ (a product), substitute into the PDE, and separate it into two ODEs:
$$\frac{1}{X} \frac{d^2 X}{dx^2} = \frac{1}{kT} \frac{dT}{dt} = -\lambda$$ (a separation constant)

Each ODE can then be solved independently using ODE techniques.
