---
id: sequences-series.retrieval-prompt
concept_id: sequences-series
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.35
exam_ids: ["*"]
estimated_minutes: 2
retention_tags: ["gp-infinite-sum"]
---

From memory, before checking: find the sum to infinity of the GP with first term $4$ and common ratio $\frac12$.

- **(A)** $6$
- **(B)** $8$
- **(C)** $\infty$
- **(D)** $4$

<details>
<summary>Answer</summary>

**B**. Since $|r|=\frac12<1$, the infinite sum formula applies:

$$S_\infty = \frac{a}{1-r} = \frac{4}{1-\frac12} = \frac{4}{\frac12} = 8$$

Sanity check by adding the first few terms: $4+2+1+0.5+0.25+\cdots$ visibly creeps toward $8$ and never passes it.

</details>
