---
id: null-space-column-space.retrieval_prompt
concept_id: null-space-column-space
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

**Question:** State the rank-nullity theorem for a matrix $A \in \mathbb{R}^{m \times n}$. What does each term represent?

<details>
<summary>Answer</summary>

**Rank-Nullity Theorem:**
$$\text{rank}(A) + \text{nullity}(A) = n$$

- **rank$(A)$** = dimension of the column space = number of pivot columns in RREF
- **nullity$(A)$** = dimension of the null space = number of free variables in RREF
- **$n$** = number of columns (dimension of the domain)

**Interpretation:** Every column is either a pivot column (contributes to rank) or a free variable (contributes to nullity). They partition the columns completely—there is no overlap and no column is left out.

</details>