---
id: analytic-functions.retrieval-prompt
concept_id: analytic-functions
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Let $f(z) = u(x,y) + iv(x,y)$ be analytic. If $u(x,y) = x^2 - y^2$, what is $v(x,y)$ (up to an additive constant)?

- **(A)** $v(x,y) = 2xy + C$
- **(B)** $v(x,y) = x^2 + y^2 + C$
- **(C)** $v(x,y) = 2xy$
- **(D)** $v(x,y) = -2xy + C$

<details>
<summary>Answer</summary>

**A**. Given $u(x,y) = x^2 - y^2$, we use the Cauchy-Riemann equations to find $v$.
From $\frac{\partial u}{\partial x} = \frac{\partial v}{\partial y}$: $\frac{\partial u}{\partial x} = 2x$, so $\frac{\partial v}{\partial y} = 2x$.
Integrate with respect to $y$: $v(x,y) = 2xy + g(x)$, where $g(x)$ is an arbitrary function of $x$ alone.
From $\frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x}$: $\frac{\partial u}{\partial y} = -2y$, so $-\frac{\partial v}{\partial x} = -2y$, which gives $\frac{\partial v}{\partial x} = 2y$.
Differentiate $v(x,y) = 2xy + g(x)$ with respect to $x$: $\frac{\partial v}{\partial x} = 2y + g'(x)$.
For this to equal $2y$, we need $g'(x) = 0$, so $g(x) = C$ (a constant).
Therefore, $v(x,y) = 2xy + C$. Note: $u + iv = x^2 - y^2 + i(2xy + C) = (x+iy)^2 + iC = z^2 + iC$, which is indeed analytic.

</details>
