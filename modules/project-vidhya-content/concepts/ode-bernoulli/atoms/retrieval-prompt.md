---
id: ode-bernoulli.retrieval-prompt
concept_id: ode-bernoulli
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Solve the Bernoulli equation $\frac{dy}{dx} - 2y = y^2$ using substitution $v = y^{-1}$. After substitution, the resulting linear ODE is:

- **(A)** $\frac{dv}{dx} + 2v = -1$
- **(B)** $\frac{dv}{dx} - 2v = 1$
- **(C)** $\frac{dv}{dx} + 2v = 1$
- **(D)** $\frac{dv}{dx} - 2v = -1$

<details>
<summary>Answer</summary>

**A**. Start with $\frac{dy}{dx} - 2y = y^2$.

Let $v = y^{-1}$, so $y = v^{-1}$ and $\frac{dy}{dx} = -v^{-2} \frac{dv}{dx}$.

Substitute:
$$-v^{-2} \frac{dv}{dx} - 2v^{-1} = v^{-2}$$

Multiply both sides by $-v^2$:
$$\frac{dv}{dx} + 2v = -1$$

This is a linear ODE in $v$ with $P(x) = 2$ and $Q(x) = -1$.

</details>
