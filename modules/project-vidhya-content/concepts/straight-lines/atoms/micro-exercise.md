---
id: straight-lines.micro-exercise
concept_id: straight-lines
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

Find the equation of the line passing through the intersection of $x+y-1=0$ and $2x-y+3=0$, and parallel to $3x+4y-5=0$.

**(A)** $9x+12y-14=0$
**(B)** $9x+12y+14=0$
**(C)** $3x+4y-14=0$
**(D)** $12x+9y-14=0$
**(E)** $9x-12y-14=0$

<details>
<summary>Answer</summary>

**(A).**

Family: $(x+y-1)+\lambda(2x-y+3)=0 \Rightarrow (2\lambda+1)x+(1-\lambda)y+(3\lambda-1)=0$.

For this to be parallel to $3x+4y-5=0$, the coefficients must be proportional: $\dfrac{2\lambda+1}{3}=\dfrac{1-\lambda}{4}$.

Cross-multiplying: $4(2\lambda+1)=3(1-\lambda) \Rightarrow 8\lambda+4=3-3\lambda \Rightarrow 11\lambda=-1 \Rightarrow \lambda=-\dfrac{1}{11}$.

Substituting back: $\left(2\left(-\dfrac{1}{11}\right)+1\right)x+\left(1-\left(-\dfrac{1}{11}\right)\right)y+\left(3\left(-\dfrac{1}{11}\right)-1\right)=0 \Rightarrow \dfrac{9}{11}x+\dfrac{12}{11}y-\dfrac{14}{11}=0$.

Multiplying through by $11$: $9x+12y-14=0$. Check: dividing by $3$ gives $3x+4y-\dfrac{14}{3}=0$ — same $(3,4)$ direction as $3x+4y-5=0$, confirming parallel.

</details>
