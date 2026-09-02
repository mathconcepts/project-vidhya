---
id: numerical-ode.retrieval-prompt
concept_id: numerical-ode
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["heuns-method", "rk2"]
---

Before checking, try to recall: for $\frac{dy}{dt}=3y$, $y(0)=2$, use Heun's method (RK2) with $h=0.1$ to find $y_1$.

- **(A)** $y_1\approx2.60$
- **(B)** $y_1\approx2.63$
- **(C)** $y_1\approx2.69$
- **(D)** $y_1\approx2.75$

<details>
<summary>Answer</summary>

**C**. $k_1=f(t_0,y_0)=3(2)=6$. $k_2=f(t_0+h,\,y_0+hk_1)=3(2+0.1\times6)=3(2.6)=7.8$. $y_1=y_0+\frac{h}{2}(k_1+k_2)=2+0.05(6+7.8)=2+0.69=2.69$.

</details>
