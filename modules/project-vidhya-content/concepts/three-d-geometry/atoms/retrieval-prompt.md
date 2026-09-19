---
id: three-d-geometry.retrieval-prompt
concept_id: three-d-geometry
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["parallel-lines", "shortest-distance"]
---

From memory, before checking: find the shortest distance between the parallel lines $\dfrac{x-1}{2}=\dfrac{y-2}{3}=\dfrac{z+4}{6}$ and $\dfrac{x+1}{2}=\dfrac{y-1}{3}=\dfrac{z+4}{6}$.

<details>
<summary>Answer</summary>

Common direction $\vec b=(2,3,6)$, $|\vec b|=\sqrt{4+9+36}=7$. Points $A_1=(1,2,-4)$, $A_2=(-1,1,-4)$, so $\vec{A_1A_2}=(-2,-1,0)$.

$$\vec b\times\vec{A_1A_2}=\begin{vmatrix}\hat i&\hat j&\hat k\\2&3&6\\-2&-1&0\end{vmatrix}=\hat i(0+6)-\hat j(0+12)+\hat k(-2+6)=(6,-12,4)$$

$$|\vec b\times\vec{A_1A_2}|=\sqrt{36+144+16}=\sqrt{196}=14$$

$$d=\frac{14}{7}=2$$

</details>
