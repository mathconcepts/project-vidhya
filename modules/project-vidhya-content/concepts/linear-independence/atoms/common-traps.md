---
id: linear-independence.common-traps
concept_id: linear-independence
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Confusing "linearly independent" with "not equal."** Two distinct non-zero vectors can still be linearly dependent if one is a scalar multiple of the other. Example: $\begin{pmatrix} 1 \\ 2 \end{pmatrix}$ and $\begin{pmatrix} 3 \\ 6 \end{pmatrix}$ are different but dependent because the second is 3 times the first.

**Trap 2: Assuming the number of vectors equals dimension means independence.** If you have 5 vectors in $\mathbb{R}^3$, they cannot all be linearly independent, no matter what they are (pigeonhole principle). A linearly independent set in $\mathbb{R}^n$ has at most $n$ vectors.

**Trap 3: Forgetting that the trivial solution ($\mathbf{c} = \mathbf{0}$) always exists.** Linear independence means the trivial solution is the **only** solution. Many students mistakenly think "independent = has a solution," forgetting to check for non-trivial solutions.

**Trap 4: Mixing up "span" and "basis."** A linearly independent set does not automatically span the space. You need both independence AND the set to span the space for it to be a basis. A set can be independent but miss part of the space.

**Trap 5: Not accounting for zero vectors.** Any set containing the zero vector $\mathbf{0}$ is automatically linearly dependent because $1 \cdot \mathbf{0} + 0 \cdot v_2 + \cdots = \mathbf{0}$ for non-trivial coefficients. The zero vector cannot be part of a basis.