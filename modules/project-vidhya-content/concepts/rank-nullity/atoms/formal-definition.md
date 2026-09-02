---
id: rank-nullity.formal-definition
concept_id: rank-nullity
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Rank**: for $A \in \mathbb{R}^{m \times n}$, $\text{rank}(A)$ is the dimension of its column space — equivalently, of its row space, or the number of linearly independent rows/columns.

**Nullity**: $\text{nullity}(A)$ is the dimension of the null space, $\{x : Ax = 0\}$.

**Rank-Nullity Theorem**: $\text{rank}(A) + \text{nullity}(A) = n$.

**Row echelon form**: to compute rank, reduce $A$ to row echelon form (REF); rank equals the number of non-zero rows in the REF.

**Method selector.** Row-reduce once — the pivot count IS the rank, and $n$ minus that count IS the nullity, with no separate computation needed for either. The tempting wrong move is subtracting from the wrong dimension: for an $m \times n$ matrix that isn't square, nullity is $n - \text{rank}(A)$ (columns), never $m - \text{rank}(A)$ (rows) — that latter quantity is the *left* nullity, $\text{nullity}(A^T)$, a genuinely different number whenever $m \neq n$.
