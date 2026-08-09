---
id: ode-higher-order.retrieval-prompt
concept_id: ode-higher-order
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

For the ODE with roots $r = 1$ (multiplicity 2) and $r = 2$ (multiplicity 1), write the general solution:

- **(A)** $y(x) = C_1 e^x + C_2 e^{2x} + C_3 e^{3x}$
- **(B)** $y(x) = (C_1 + C_2 x)e^x + C_3 e^{2x}$
- **(C)** $y(x) = (C_1 + C_2 x + C_3 x^2)e^x$
- **(D)** $y(x) = C_1 e^x + C_2 xe^x + C_3 e^{2x}$

<details>
<summary>Answer</summary>

**D**. When a root has multiplicity $m > 1$, the solution includes polynomial factors of degree $m - 1$ times the exponential.

For $r = 1$ with multiplicity 2: the terms are $e^x$ and $xe^x$, so we write $(C_1 + C_2 x)e^x = C_1 e^x + C_2 xe^x$.

For $r = 2$ with multiplicity 1: the term is $e^{2x}$.

Combining:
$$y(x) = C_1 e^x + C_2 xe^x + C_3 e^{2x}$$

Option B is written differently but is equivalent: $(C_1 + C_2 x)e^x + C_3 e^{2x}$. Both D and B are the same; D separates the repeated root term explicitly.

</details>
