---
id: vectors-jee.retrieval-prompt
concept_id: vectors-jee
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["scalar-triple-product", "coplanarity"]
---

From memory, before checking: are $\vec a=\hat i-2\hat j+3\hat k$, $\vec b=2\hat i+\hat j-\hat k$, $\vec c=5\hat j-7\hat k$ coplanar? Compute the one number that decides it.

<details>
<summary>Answer</summary>

Yes, coplanar. Compute the scalar triple product $[\vec a\ \vec b\ \vec c]=\vec a\cdot(\vec b\times\vec c)$:

$$\vec b\times\vec c=\begin{vmatrix}\hat i&\hat j&\hat k\\2&1&-1\\0&5&-7\end{vmatrix}=\hat i(1\cdot(-7)-(-1)\cdot5)-\hat j(2\cdot(-7)-(-1)\cdot0)+\hat k(2\cdot5-1\cdot0)=(-2,14,10)$$

$$\vec a\cdot(-2,14,10)=(1)(-2)+(-2)(14)+(3)(10)=-2-28+30=0$$

The scalar triple product is $0$, so $\vec a,\vec b,\vec c$ lie in one plane.

</details>
