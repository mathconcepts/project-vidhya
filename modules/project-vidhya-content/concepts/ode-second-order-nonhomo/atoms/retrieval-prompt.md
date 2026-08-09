---
id: ode-second-order-nonhomo.retrieval-prompt
concept_id: ode-second-order-nonhomo
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Solve $\frac{d^2y}{dx^2} - y = 4\sin(x)$. The form of the particular solution (using undetermined coefficients) should be:

- **(A)** $y_p = A\sin(x)$
- **(B)** $y_p = A\sin(x) + B\cos(x)$
- **(C)** $y_p = x(A\sin(x) + B\cos(x))$
- **(D)** $y_p = Ax\sin(x)$

<details>
<summary>Answer</summary>

**B**. The non-homogeneous term is $f(x) = 4\sin(x)$.

First, find the homogeneous solution for $\frac{d^2y}{dx^2} - y = 0$:
$$r^2 - 1 = 0 \Rightarrow r = \pm 1$$
$$y_h = C_1 e^x + C_2 e^{-x}$$

The homogeneous solution contains exponentials, NOT sines or cosines. Therefore, $\sin(x)$ and $\cos(x)$ are not resonant with the homogeneous solution.

When the non-homogeneous term is $\sin(x)$ or $\cos(x)$ (and not a homogeneous solution), the standard guess includes BOTH sine and cosine:
$$y_p = A\sin(x) + B\cos(x)$$

We need both because $y_p''$ will produce both sine and cosine terms when we differentiate, and we need to match the coefficient of $\sin(x)$ on the right side.

</details>
