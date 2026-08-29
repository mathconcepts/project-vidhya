---
id: null-space-column-space.mnemonic
concept_id: null-space-column-space
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Pivots build the Column space, Free variables fill the Null space."** After row reduction, every column is one or the other, and each kind hands you a basis for a different subspace:

- **Pivot** columns → a basis for $\text{Col}(A)$. Take them from the **original** $A$, never from the RREF — row operations preserve the *number* of independent columns but move the columns themselves.
- **Free** variables → one null space basis vector each. Set one free variable to 1, the rest to 0, back-substitute.

**Where each subspace lives — "$n$ for Null."** Both letters are about *inputs*:

$$\text{Null}(A) \subseteq \mathbb{R}^n, \qquad \text{Col}(A) \subseteq \mathbb{R}^m$$

$x$ has to have $n$ entries for $Ax$ to make sense, so the null space sits in $\mathbb{R}^n$ — where $n$ is the number of **columns**. The outputs $Ax$ have $m$ entries, so the column space sits in $\mathbb{R}^m$.

**Sanity-check reflex:** count columns, not rows. rank $+$ nullity $= n$ every time, and $n$ is the width of the matrix. Confirm your two counts add to the number of columns before you go any further.
