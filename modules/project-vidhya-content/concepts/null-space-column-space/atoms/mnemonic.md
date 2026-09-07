---
id: null-space-column-space.mnemonic
concept_id: null-space-column-space
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Pivots build the Column space, Free variables fill the Null space."** Row-reduce the matrix (simplify it row by row into a staircase pattern) and every column ends up as one of two kinds: a "pivot" column (holds the first non-zero entry of its row in the staircase) or a "free" column (doesn't). Each kind hands you a building block — a "basis" vector, one of the simplest pieces you combine to build the whole subspace — for a different subspace:

- **Pivot** columns → a basis for $\text{Col}(A)$, the column space (everything $Ax$ can ever output). Take these columns from the **original** matrix $A$, never from the row-reduced version — row operations keep the *count* of independent columns the same but can shuffle the columns themselves around.
- **Free** columns → one null-space basis vector each. Set that free variable to 1, every other free variable to 0, then solve backward for the rest (this backward solve is called "back-substitution") to fill in the vector.

**Where each subspace lives — "$n$ for Null."** Both letters are about the *inputs* going into the matrix:

$$\text{Null}(A) \subseteq \mathbb{R}^n, \qquad \text{Col}(A) \subseteq \mathbb{R}^m$$

$x$ needs $n$ entries for $Ax$ to make sense, so the null space (every input that maps to zero) sits in $\mathbb{R}^n$ — where $n$ is the number of **columns**. The outputs $Ax$ have $m$ entries, so the column space sits in $\mathbb{R}^m$.

**Sanity-check reflex:** count columns, not rows. rank (the number of pivot columns) plus nullity (the number of free columns) always equals $n$, the width of the matrix. Confirm your two counts add up to the number of columns before you move on.
