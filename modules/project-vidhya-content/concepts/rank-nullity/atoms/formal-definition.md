---
id: rank-nullity.formal-definition
concept_id: rank-nullity
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Rank**: The rank of a matrix $A \in \mathbb{R}^{m \times n}$, denoted $\text{rank}(A)$, is the dimension of its column space (the span of its column vectors). Equivalently, it is the dimension of its row space, or the number of linearly independent rows/columns.

**Nullity**: The nullity of $A$, denoted $\text{nullity}(A)$ or $\text{null}(A)$, is the dimension of the null space—the set of all vectors $x$ such that $Ax = 0$.

**Rank-Nullity Theorem**: For an $m \times n$ matrix $A$:
$$\text{rank}(A) + \text{nullity}(A) = n$$

**Row Echelon Form**: To compute rank, reduce $A$ to row echelon form (REF). The rank equals the number of non-zero rows in the REF.
