---
id: line-integrals.retrieval-prompt
concept_id: line-integrals
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

For the vector field $\mathbf{F}(x, y) = (3x^2 - 2y) \mathbf{i} + (3y^2 - 2x) \mathbf{j}$, is the line integral from $(0, 0)$ to $(1, 1)$ path-dependent? If not, compute the integral.

- **(A)** Path-dependent; value depends on the curve chosen
- **(B)** Path-independent; value = 0
- **(C)** Path-independent; value = 1
- **(D)** Path-independent; value = 2

<details>
<summary>Answer</summary>

**B**. Check conservativeness:

$P = 3x^2 - 2y$, $Q = 3y^2 - 2x$

$\frac{\partial P}{\partial y} = -2$, $\frac{\partial Q}{\partial x} = -2$ ✓ Conditions match, so $\nabla \times \mathbf{F} = \mathbf{0}$ ⟹ **Path-independent.**

Find potential:

$\frac{\partial f}{\partial x} = 3x^2 - 2y \Rightarrow f = x^3 - 2xy + g(y)$

$\frac{\partial f}{\partial y} = 3y^2 - 2x \Rightarrow -2x + g'(y) = 3y^2 - 2x \Rightarrow g'(y) = 3y^2 \Rightarrow g(y) = y^3$

Thus $f(x, y) = x^3 - 2xy + y^3$.

Line integral:
$$\int_C \mathbf{F} \cdot d\mathbf{r} = f(1, 1) - f(0, 0) = (1 - 2 + 1) - 0 = 0$$

Check: $x^3 - 2xy + y^3$ at $(1,1)$ is $1 - 2 + 1 = 0$; at $(0,0)$ it's $0$. The integral is $0$.

</details>
