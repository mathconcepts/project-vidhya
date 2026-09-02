---
id: rank-nullity.common-traps
concept_id: rank-nullity
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: rank-nullity.micro-exercise
---

**Trap 1 — Confusing rank with row/column count.** Rank is NOT the number of rows or columns — it's the number of *linearly independent* rows/columns, which can be less.

**Trap 2 — Forgetting the theorem itself.** Students compute rank correctly, then guess nullity instead of using $\text{rank}(A)+\text{nullity}(A)=n$.

**Trap 3 — Counting dependent rows as rank.** When one row is a multiple of another, they contribute only one to the rank. Counting every non-zero row misses the dependence.

**Trap 4 — Subtracting from the wrong dimension.** Nullity is $n-\text{rank}(A)$, where $n$ is the number of **columns** — not rows. For a non-square matrix these differ.
