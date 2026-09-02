---
id: ode-second-order-nonhomo.micro-exercise
concept_id: ode-second-order-nonhomo
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
estimated_minutes: 2
---

Find a particular solution of $y''-y=x^2$.

<details>
<summary>Answer</summary>

Trial $y_p=Ax^2+Bx+C$ (no resonance: roots are $\pm1$, no polynomial homogeneous solutions).

$y_p''=2A$. Substitute: $2A-(Ax^2+Bx+C)=x^2$.

Match coefficients: $-A=1\Rightarrow A=-1$; $-B=0\Rightarrow B=0$; $2A-C=0\Rightarrow C=-2$.

$$y_p=-x^2-2$$

</details>
