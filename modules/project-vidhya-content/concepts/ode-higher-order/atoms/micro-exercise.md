---
id: ode-higher-order.micro-exercise
concept_id: ode-higher-order
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
estimated_minutes: 2
---

The general solution of $y'''-3y''+3y'-y=0$ is:

- **(A)** $y=(C_1+C_2x+C_3x^2)e^{x}$
- **(B)** $y=C_1e^{x}+C_2e^{2x}+C_3e^{3x}$
- **(C)** $y=(C_1+C_2x+C_3x^2)e^{-x}$
- **(D)** $y=C_1e^{x}+C_2xe^{x}$

<details>
<summary>Answer</summary>

**A**. Auxiliary equation $r^3-3r^2+3r-1=0$ is exactly $(r-1)^3=0$ — a single root $r=1$ with multiplicity $3$. A real root of multiplicity $m$ contributes $(C_1+C_2x+\cdots+C_mx^{m-1})e^{rx}$, so $m=3$ gives $(C_1+C_2x+C_3x^2)e^{x}$ — three constants for a third-order equation.

</details>
