---
id: pde-basics.common-traps
concept_id: pde-basics
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing PDEs with ODEs:** Many students try to integrate a PDE as if it were an ODE, missing the fact that derivatives are partial (with respect to different variables). Always identify all independent variables first.
- **Forgetting that separation assumes a product form:** The method $u(x,t) = X(x)T(t)$ is an assumption, not a general solution. It works for linear PDEs with certain boundary conditions. Non-separable PDEs or non-homogeneous boundary conditions require different approaches.
- **Boundary vs. initial conditions confusion:** Boundary conditions (e.g., $u(0,t) = 0$) constrain the spatial part and determine eigenvalues. Initial conditions (e.g., $u(x, 0) = f(x)$) constrain the temporal part and determine time coefficients. Mixing these up breaks the method.
