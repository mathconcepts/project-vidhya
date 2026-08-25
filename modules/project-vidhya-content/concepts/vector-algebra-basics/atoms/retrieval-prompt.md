---
id: vector-algebra-basics.retrieval-prompt
concept_id: vector-algebra-basics
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.35
exam_ids: ["*"]
estimated_minutes: 3
---

Given $\vec{a} = (1, 2, 3)$, $\vec{b} = (2, 3, 4)$, and $\vec{c} = (3, 5, 7)$, are the three vectors coplanar?

- **(A)** Not coplanar; the scalar triple product is $1$
- **(B)** Coplanar, since the scalar triple product $[\vec{a}\ \vec{b}\ \vec{c}] = 0$
- **(C)** Not coplanar; the scalar triple product is $6$
- **(D)** Cannot be determined without knowing the angle between the vectors

<details>
<summary>Answer</summary>

**B**. Compute the scalar triple product as a determinant:

$$[\vec{a}\ \vec{b}\ \vec{c}] = \begin{vmatrix} 1 & 2 & 3 \\ 2 & 3 & 4 \\ 3 & 5 & 7 \end{vmatrix}$$

Expand along the first row:

$$= 1(3\cdot7 - 4\cdot5) - 2(2\cdot7 - 4\cdot3) + 3(2\cdot5 - 3\cdot3)$$
$$= 1(21-20) - 2(14-12) + 3(10-9)$$
$$= 1(1) - 2(2) + 3(1) = 1 - 4 + 3 = 0$$

Since $[\vec{a}\ \vec{b}\ \vec{c}] = 0$, the parallelepiped the three vectors would form has **zero volume** — they lie flat in a common plane. The vectors are **coplanar**.

D) is wrong because coplanarity is decided purely by the scalar triple product being zero — no angle needs to be found separately; the determinant already encodes all three vectors' mutual orientation.

The correct answer is B.

</details>
