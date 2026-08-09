---
id: implicit-differentiation.micro-exercise
concept_id: implicit-differentiation
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Using implicit differentiation, find $\dfrac{dy}{dx}$ for the circle $x^2 + y^2 = r^2$ (where $r$ is a constant).

- **(A)** $\dfrac{x}{y}$
- **(B)** $-\dfrac{y}{x}$
- **(C)** $-\dfrac{x}{y}$
- **(D)** $\dfrac{y}{x}$

<details>
<summary>Answer</summary>

**C**. Differentiate both sides w.r.t. $x$: $\frac{d}{dx}(x^2) + \frac{d}{dx}(y^2) = \frac{d}{dx}(r^2)$. Since $r$ is constant, the right side is 0. Left side: $2x + 2y\frac{dy}{dx} = 0$. Solve for $\frac{dy}{dx}$: $2y\frac{dy}{dx} = -2x \Rightarrow \frac{dy}{dx} = -\frac{x}{y}$. Key step: $\frac{d}{dx}[y^2] = 2y \cdot \frac{dy}{dx}$ by the chain rule (NOT just $2y$).

</details>
