---
id: vector-fields.micro-exercise
concept_id: vector-fields
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Consider the vector field $\mathbf{F}(x, y) = 2xy\mathbf{i} + x^2\mathbf{j}$. Find the potential function $f(x, y)$ such that $\mathbf{F} = \nabla f$.

- **(A)** $f(x, y) = x^2y + C$
- **(B)** $f(x, y) = xy^2 + C$
- **(C)** $f(x, y) = x^2y + y + C$
- **(D)** No potential function exists (non-conservative)

<details>
<summary>Answer</summary>

**A**. For $\mathbf{F} = P\mathbf{i} + Q\mathbf{j}$ to be conservative, we need $\frac{\partial P}{\partial y} = \frac{\partial Q}{\partial x}$. Check: $\frac{\partial(2xy)}{\partial y} = 2x$ and $\frac{\partial(x^2)}{\partial x} = 2x$ ✓ Conservative.

Find $f$: From $\frac{\partial f}{\partial x} = 2xy$, integrate w.r.t. $x$: $f = x^2y + g(y)$.

From $\frac{\partial f}{\partial y} = x^2$, differentiate $f$ w.r.t. $y$: $\frac{\partial}{\partial y}[x^2y + g(y)] = x^2 + g'(y) = x^2$ ⟹ $g'(y) = 0$ ⟹ $g(y) = C$.

Therefore, $f(x, y) = x^2y + C$.

</details>
