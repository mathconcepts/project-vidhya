---
id: ode-second-order-homo.retrieval-prompt
concept_id: ode-second-order-homo
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

For the ODE $\frac{d^2y}{dx^2} - 2\frac{dy}{dx} + y = 0$ (repeated root $r = 1$), the general solution is:

- **(A)** $y(x) = (C_1 + C_2 x)e^x$
- **(B)** $y(x) = C_1 e^x + C_2 e^{-x}$
- **(C)** $y(x) = e^x(C_1 \cos(x) + C_2 \sin(x))$
- **(D)** $y(x) = C_1 e^{2x} + C_2 e^{-2x}$

<details>
<summary>Answer</summary>

**A**. When the characteristic equation has a repeated root $r = r_0$ (with multiplicity 2), the general solution is:
$$y(x) = (C_1 + C_2 x)e^{r_0 x}$$

With $r_0 = 1$:
$$y(x) = (C_1 + C_2 x)e^x$$

This solution has two linearly independent components: $e^x$ and $xe^x$. The factor $(C_1 + C_2 x)$ represents the polynomial part introduced by the repeated root.

</details>
