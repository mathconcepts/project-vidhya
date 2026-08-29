---
id: linear-independence.interleaved-drill
concept_id: linear-independence
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: linear-independence.micro-exercise
---

**Cross-concept check: linear independence lives inside a vector space.**

Let $W = \{(x, y, z) \in \mathbb{R}^3 : x + y + z = 0\}$, and take

$$w_1 = (1, -1, 0), \quad w_2 = (0, 1, -1), \quad w_3 = (1, 0, -1)$$

Each has coordinates summing to zero, so all three lie in $W$.

**Question 1 (linear independence):** Is $\{w_1, w_2, w_3\}$ independent?

*Answer:* No. $w_1 + w_2 = (1 + 0,\; -1 + 1,\; 0 - 1) = (1, 0, -1) = w_3$, so $w_1 + w_2 - w_3 = \mathbf{0}$ is a non-trivial relation. Dependent, with the witness written out.

**Question 2 (vector spaces):** You could have known that before computing anything. How?

*Answer:* $W$ is the null space of the $1 \times 3$ matrix $\begin{pmatrix} 1 & 1 & 1\end{pmatrix}$, which has rank 1, so $\dim W = 3 - 1 = 2$. Three vectors in a 2-dimensional space are **always** dependent — the count test fires immediately.

The subtlety: the count is against $\dim W = 2$, **not** against the 3 coordinates each vector is written with. The vectors are $3$-tuples living in a $2$-dimensional space. And $\{w_1, w_2\}$ *is* a basis of $W$ — two independent vectors ($w_2$ is not a multiple of $w_1$) in a 2-dimensional space.

**Why this drill exists:** students read "three vectors, three coordinates, so I need a $3\times3$ determinant." But independence is defined relative to the vector space the vectors actually inhabit, and the ambient space here is $W$, not $\mathbb{R}^3$. Miss that and you do avoidable arithmetic on subspace questions — and you'll mis-handle the reverse case too, where a set is independent in $\mathbb{R}^n$ but you're asked whether it spans a proper subspace it doesn't even sit inside.
