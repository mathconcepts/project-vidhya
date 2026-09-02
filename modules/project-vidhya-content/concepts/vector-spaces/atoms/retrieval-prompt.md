---
id: vector-spaces.retrieval-prompt
concept_id: vector-spaces
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["linear-independence", "span"]
---

From memory, before checking: are $(1,2,3)$, $(2,4,6)$, and $(1,1,1)$ linearly independent?

- **(A)** Yes, independent
- **(B)** No, dependent
- **(C)** Cannot determine
- **(D)** Dependent only in some subspaces

<details>
<summary>Answer</summary>

**B**. $(2,4,6) = 2(1,2,3)$ — the second vector is a scalar multiple of the first, so $2(1,2,3) - (2,4,6) + 0(1,1,1) = \mathbf{0}$ is a non-trivial combination equal to zero. The three vectors are linearly dependent.

</details>
