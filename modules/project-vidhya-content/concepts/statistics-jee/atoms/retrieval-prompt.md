---
id: statistics-jee.retrieval-prompt
concept_id: statistics-jee
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.35
exam_ids: ["*"]
estimated_minutes: 2
retention_tags: ["variance-scaling", "coefficient-of-variation"]
---

From memory, before checking: a dataset has mean $6$ and variance $8$. Every observation is multiplied by $3$ and then increased by $5$. What is the new variance?

- **(A)** $8$
- **(B)** $24$
- **(C)** $72$
- **(D)** $29$

<details>
<summary>Answer</summary>

**C**. $\text{Var}(aX+b)=a^2\text{Var}(X)$ — shifting by $b$ never changes variance, only scaling by $a$ does, and it scales by $a^2$, not $a$.

$$\text{Var}(3X+5)=3^2\times8=9\times8=72$$

(The new MEAN would be $3(6)+5=23$ — that number is not asked for here, but confusing it with the variance question is the exact trap this recall check is guarding against.)

</details>
