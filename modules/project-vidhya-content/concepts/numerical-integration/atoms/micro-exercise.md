---
id: numerical-integration.micro-exercise
concept_id: numerical-integration
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Approximate $\int_0^1 x^2\,dx$ using the trapezoidal rule with $n=2$.

- **(A)** $I\approx0.375$
- **(B)** $I\approx0.3125$
- **(C)** $I\approx0.25$
- **(D)** $I\approx0.5$

<details>
<summary>Answer</summary>

**A**. $h=0.5$, nodes $0,0.5,1$, $f=0,0.25,1$. $I\approx\frac{0.5}{2}[0+2(0.25)+1]=\frac{0.5}{2}(1.5)=0.375$. Exact $=1/3\approx0.333$; error $\approx0.042$.

</details>
