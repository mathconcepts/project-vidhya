---
id: taylor-laurent.retrieval-prompt
concept_id: taylor-laurent
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["laurent-series", "residue"]
---

From memory, before checking: what is the residue at $z=0$ of $f(z)=\dfrac{1}{z(z-1)}$, expanded in the annulus $0<|z|<1$?

<details>
<summary>Answer</summary>

$-1$. Partial fractions: $\dfrac1{z(z-1)}=\dfrac{-1}z+\dfrac1{z-1}$. For $|z|<1$: $\dfrac1{z-1}=-\sum_{n=0}^\infty z^n$. So $f(z)=-\dfrac1z-1-z-z^2-\cdots$, and the coefficient of $z^{-1}$ is $-1$.
</details>
