---
id: numerical-integration.retrieval-prompt
concept_id: numerical-integration
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["simpsons-rule", "composite-weights"]
---

Before checking, try to recall: approximate $\int_0^2\frac{1}{1+x}\,dx$ using Simpson's 1/3 rule with $n=2$.

- **(A)** $I\approx1.1111$
- **(B)** $I\approx1.067$
- **(C)** $I\approx1.133$
- **(D)** $I\approx1.2$

<details>
<summary>Answer</summary>

**A**. $h=\frac{2-0}{2}=1$. Nodes $0,1,2$: $f=1,\,0.5,\,0.3333$. $I\approx\frac{1}{3}[1+4(0.5)+0.3333]=\frac{1}{3}(3.3333)=1.1111$. (Exact: $\ln3\approx1.0986$.)

</details>
