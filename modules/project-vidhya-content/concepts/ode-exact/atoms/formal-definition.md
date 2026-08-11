---
id: ode-exact.formal-definition
concept_id: ode-exact
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Exact Equation Standard Form**: An equation of the form
$$M(x, y) \, dx + N(x, y) \, dy = 0$$
is **exact** if there exists a function $F(x, y)$ such that
$$\frac{\partial F}{\partial x} = M(x, y) \quad \text{and} \quad \frac{\partial F}{\partial y} = N(x, y)$$

**Exactness Test**: The equation is exact if and only if
$$\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x}$$

**Solution Method**: If the equation is exact, the solution is $F(x, y) = C$ (an implicit curve), where:
1. Integrate $M$ with respect to $x$: $F(x, y) = \int M(x, y) \, dx + g(y)$
2. Differentiate with respect to $y$ and compare with $N$ to find $g(y)$.
