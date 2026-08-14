---
id: null-space-column-space.formal_definition
concept_id: null-space-column-space
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Null Space (Kernel):** For $A \in \mathbb{R}^{m \times n}$, the null space is
$$\text{Null}(A) = \{x \in \mathbb{R}^n : Ax = \mathbf{0}\}$$
This is a subspace of $\mathbb{R}^n$, and its dimension is called the **nullity** of $A$.

**Column Space (Range):** The column space is
$$\text{Col}(A) = \text{span}\{\text{columns of } A\} = \{Ax : x \in \mathbb{R}^n\}$$
This is a subspace of $\mathbb{R}^m$, and its dimension is the **rank** of $A$.

**Rank-Nullity Theorem:** For any $A \in \mathbb{R}^{m \times n}$:
$$\text{rank}(A) + \text{nullity}(A) = n$$
In other words, the dimension of column space plus dimension of null space equals the number of columns. This reflects the fundamental split: columns are partitioned into pivot columns (spanning column space) and free variables (generating null space basis vectors).