---
id: random-variables.retrieval-prompt
concept_id: random-variables
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["variance-formula", "pmf-sum-to-one"]
---

From memory: write variance in terms of $E[X^2]$ and $E[X]$, then state why it can never come out negative.

<details>
<summary>Answer</summary>

$\text{Var}(X)=E[X^2]-(E[X])^2$. It's non-negative because $E[X^2]\ge (E[X])^2$ always (Jensen's inequality applied to the convex function $x^2$).
</details>
