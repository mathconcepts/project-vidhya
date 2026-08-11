---
id: rank-nullity.common-traps
concept_id: rank-nullity
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing rank with the number of rows/columns**: Rank is NOT the number of rows or columns—it's the number of linearly independent rows/columns, which can be less.
- **Forgetting the rank-nullity sum**: Students often compute rank correctly but then forget that $\text{rank}(A) + \text{nullity}(A) = n$. They might incorrectly guess nullity without using this fundamental theorem.
- **Counting dependent rows as rank**: When rows are linearly dependent (e.g., one is a multiple of another), they contribute only one to the rank. Students sometimes count each non-zero row, missing the dependence.
