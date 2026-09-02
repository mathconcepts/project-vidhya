---
id: ode-second-order-homo.micro-exercise
concept_id: ode-second-order-homo
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
estimated_minutes: 2
---

Solve $y''+6y'+9y=0$ with $y(0)=1$, $y'(0)=-1$.

- **(A)** $y=(1+2x)e^{-3x}$
- **(B)** $y=e^{-3x}+e^{-3x}$
- **(C)** $y=(1-2x)e^{-3x}$
- **(D)** $y=(1+2x)e^{3x}$

<details>
<summary>Answer</summary>

**A**. Characteristic equation: $r^2+6r+9=0 \Rightarrow (r+3)^2=0 \Rightarrow r=-3$ (repeated).

General solution: $y=(C_1+C_2x)e^{-3x}$.

$y(0)=C_1=1$.

$y'(x)=C_2e^{-3x}-3(C_1+C_2x)e^{-3x}$, so $y'(0)=C_2-3C_1=-1 \Rightarrow C_2=3(1)-1=2$.

$y=(1+2x)e^{-3x}$.

</details>
