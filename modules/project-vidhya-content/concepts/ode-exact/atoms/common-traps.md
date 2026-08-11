---
id: ode-exact.common-traps
concept_id: ode-exact
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting to verify exactness first:** Students jump straight to integration without checking $\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x}$. If the equation isn't exact, the method fails. Always verify first.
- **Losing the $g(y)$ term during integration:** When integrating $M$ with respect to $x$, students sometimes forget to add $g(y)$ (the "constant" of integration that may depend on $y$). This term is crucial for recovering $F(x, y)$ completely.
- **Confusing $F(x, y)$ with an explicit solution $y(x)$:** The solution to an exact equation is usually implicit: $F(x, y) = C$. Students sometimes expect to solve explicitly for $y$, which may be impossible or very complex.
