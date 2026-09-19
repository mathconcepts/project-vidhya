---
id: vectors-jee.micro-exercise
concept_id: vectors-jee
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
estimated_minutes: 2
---

The adjacent sides of a triangle are given by $\vec a=2\hat i-\hat j+2\hat k$ and $\vec b=-\hat i+2\hat j+2\hat k$. Find the area of the triangle.

- **(A)** $9$
- **(B)** $9/2$
- **(C)** $18$
- **(D)** $\sqrt{35}/2$
- **(E)** $9/4$

<details>
<summary>Answer</summary>

**B**. The area of a triangle with adjacent sides $\vec a,\vec b$ is $\frac12|\vec a\times\vec b|$ — half the parallelogram's area, since the parallelogram splits into two identical triangles.

$$\vec a\times\vec b=\begin{vmatrix}\hat i&\hat j&\hat k\\2&-1&2\\-1&2&2\end{vmatrix}=\hat i(-1\cdot2-2\cdot2)-\hat j(2\cdot2-2\cdot(-1))+\hat k(2\cdot2-(-1)(-1))=(-6,-6,3)$$

$$|\vec a\times\vec b|=\sqrt{36+36+9}=\sqrt{81}=9$$

Area $=\dfrac{9}{2}$. **(A)** is the parallelogram's full area, not the triangle's — the most common wrong pick here.

</details>
