---
id: linear-transformations.exam-pattern
concept_id: linear-transformations
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **MCQ "which of these is a linear transformation" — test $T(\mathbf{0})$ first.** It eliminates every affine distractor in one substitution. $T(x,y) = (x+1, y)$ gives $T(0,0) = (1,0) \neq (0,0)$: not linear, done. Only if $T(\mathbf{0}) = \mathbf{0}$ survives do you check additivity and homogeneity.

- **NAT "find rank / nullity / dim of the kernel" — build the matrix, then row-reduce once.** Both numbers come from that one reduction: $\text{rank} = $ number of pivots, $\text{nullity} = n - \text{rank}$. Never compute the kernel basis to *count* its dimension.

  Example: $T(x,y,z) = (x+y, y+z)$ has $A = \begin{pmatrix} 1&1&0\\0&1&1 \end{pmatrix}$, already in echelon shape with 2 pivots. Rank 2, nullity $3 - 2 = 1$ — no row operations performed at all.

- **The composition trap: order reverses.** The matrix of $S \circ T$ (do $T$, then $S$) is $A_S A_T$ — the matrix you apply *second* is written *first*. GATE offers $A_T A_S$ as the plausible wrong option, and the shapes often still conform, so dimension-checking won't save you.

- **The change-of-basis trap.** "The" matrix of $T$ is only the standard-basis matrix by convention. When the question supplies bases $\mathcal{B}$ for $V$ and $\mathcal{C}$ for $W$, the entries of $[T]_{\mathcal{C}}^{\mathcal{B}}$ are the coordinates of $T(b_j)$ **in $\mathcal{C}$**, not the raw output vectors. Forgetting the second half is the standard slip.

- **Injective / surjective, stated in rank-nullity terms:** injective $\iff \ker(T) = \{\mathbf{0}\} \iff$ nullity $0 \iff \text{rank} = \dim V$; surjective $\iff \text{rank} = \dim W$. For $T: V \to V$ with $\dim V$ finite the two are **equivalent** — a free elimination on MSQ options that claim one without the other.

- **Time budget:** a linearity check is under 30 seconds via $T(\mathbf{0})$. Rank and nullity for a $2\times3$ or $3\times3$ is one reduction, under 90 seconds. If you're solving for a kernel basis on a question that only asked for the nullity, stop — rank-nullity hands you the number.
