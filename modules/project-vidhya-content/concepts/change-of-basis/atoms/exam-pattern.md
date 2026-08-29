---
id: change-of-basis.exam-pattern
concept_id: change-of-basis
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **MCQ/MSQ: "which of these is the same for $A$ and $P^{-1}AP$?"** This is the most common form, and it is pure recall — no computation. **Invariant** under a change of basis: trace, determinant, rank, eigenvalues, characteristic polynomial. **Not invariant:** the individual entries, and the eigenvectors (they get re-expressed as $P^{-1}v$).

  Example: $T$ swaps coordinates in $\mathbb{R}^2$, so $[T]_E = \begin{pmatrix} 0 & 1 \\ 1 & 0\end{pmatrix}$. In the basis $B = \left\{\begin{pmatrix}1\\1\end{pmatrix}, \begin{pmatrix}1\\-1\end{pmatrix}\right\}$ with $P = \begin{pmatrix} 1 & 1 \\ 1 & -1\end{pmatrix}$, the matrix becomes $[T]_B = P^{-1}[T]_E P = \begin{pmatrix} 1 & 0 \\ 0 & -1\end{pmatrix}$ (verified). Every entry changed; trace $0$ and determinant $-1$ did not.

- **The direction trap.** GATE will state "$P$ is the matrix that converts $B$-coordinates to standard coordinates" — or the exact reverse — and the two answers both appear in the options. Read that sentence twice before you write anything. Getting it backwards produces $P[T]_BP^{-1}$, which is a legitimate-looking matrix and a zero-mark answer.

- **The shortcut GATE is testing for.** If $B$ is an **eigenbasis** of $T$, then $[T]_B$ is diagonal with the eigenvalues on it — you can write the answer down with no matrix multiplication at all. In the example above, $(1,1)$ and $(1,-1)$ are exactly the eigenvectors of the swap, which is why the answer came out $\text{diag}(1,-1)$.

- **Orthonormal shortcut.** When the new basis is orthonormal, $P^{-1} = P^T$. Inverting a $3\times3$ by adjugate costs two minutes; transposing costs five seconds. Always check the columns for orthonormality first.

- **Time budget:** a $2\times2$ sandwich should take under 2 minutes end to end. If you are inverting a $3\times3$ $P$ by cofactors, stop — look for an eigenbasis or orthonormal columns, because GATE almost always plants one of the two.
