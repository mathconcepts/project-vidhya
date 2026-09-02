---
id: vector-fields.retrieval-prompt
concept_id: vector-fields
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["conservative-field", "mixed-partials-test"]
---

From memory, before checking: what single test tells you whether a planar field $\mathbf F=(P,Q)$ is conservative, and what does passing it hand you?

<details>
<summary>Answer</summary>

Check $\partial Q/\partial x = \partial P/\partial y$. If it holds, $\mathbf F$ is conservative and has a scalar potential $\phi$ with $\nabla\phi=\mathbf F$, found by integrating $P$ in $x$ and matching the result's $y$-derivative to $Q$.
</details>
