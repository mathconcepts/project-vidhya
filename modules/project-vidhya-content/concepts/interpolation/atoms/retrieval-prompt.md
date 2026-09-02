---
id: interpolation.retrieval-prompt
concept_id: interpolation
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["lagrange-basis", "weight-sum-check"]
---

Before checking, try to recall: given $(1,2)$, $(2,5)$, $(3,10)$, what is the Lagrange estimate $P(2.5)$?

- **(A)** $P(2.5)=6.75$
- **(B)** $P(2.5)=7.25$
- **(C)** $P(2.5)=7.5$
- **(D)** $P(2.5)=8$

<details>
<summary>Answer</summary>

**B**. $L_0(2.5)=\frac{(0.5)(-0.5)}{(-1)(-2)}=-0.125$, $L_1(2.5)=\frac{(1.5)(-0.5)}{(1)(-1)}=0.75$, $L_2(2.5)=\frac{(1.5)(0.5)}{(2)(1)}=0.375$. Check: $-0.125+0.75+0.375=1$ ✓. $P(2.5)=2(-0.125)+5(0.75)+10(0.375)=-0.25+3.75+3.75=7.25$.

</details>
