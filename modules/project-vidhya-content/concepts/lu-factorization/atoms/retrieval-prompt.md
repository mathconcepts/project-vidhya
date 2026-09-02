---
id: lu-factorization.retrieval_prompt
concept_id: lu-factorization
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["LU-factorization", "forward-backward-substitution"]
---

Before checking: once $A=LU$ is known, what two steps solve $Ax=b$, and which order do they run in?

<details><summary>Answer</summary>

Forward substitution solves $Ly=b$ for $y$ (top row to bottom, since $L$ is lower triangular). Back substitution then solves $Ux=y$ for $x$ (bottom row to top, since $U$ is upper triangular). Reversing the order fails — $U$'s bottom row has only one unknown, $L$'s top row does too, but for opposite directions.
</details>
