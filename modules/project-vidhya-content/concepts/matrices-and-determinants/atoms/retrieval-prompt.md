---
id: matrices-and-determinants.retrieval-prompt
concept_id: matrices-and-determinants
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.35
exam_ids: ["*"]
estimated_minutes: 2
retention_tags: ["determinant-scaling"]
---

From memory, before checking: if $A$ is a $3\times3$ matrix with $\det(A)=5$, find $\det(2A)$.

- **(A)** $10$
- **(B)** $15$
- **(C)** $40$
- **(D)** $8$

<details>
<summary>Answer</summary>

**C**. For an $n\times n$ matrix, $\det(kA)=k^n\det(A)$. Here $n=3$ and $k=2$:

$$\det(2A)=2^3\times5=8\times5=40$$

Doubling every entry does not double the determinant — it multiplies it by $2^3$, since each of the $3$ rows independently contributes a factor of $2$.

</details>
