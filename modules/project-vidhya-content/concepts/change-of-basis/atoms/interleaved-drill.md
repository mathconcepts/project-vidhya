---
id: change-of-basis.interleaved-drill
concept_id: change-of-basis
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: change-of-basis.micro-exercise
---

**Cross-concept check: linear transformations → change of basis.**

$T: \mathbb{R}^2 \to \mathbb{R}^2$ is the reflection across the line $y = x$. Use the basis $B = \{v_1, v_2\}$ with $v_1 = \begin{pmatrix} 1 \\ 1\end{pmatrix}$, $v_2 = \begin{pmatrix} 1 \\ -1\end{pmatrix}$, so $P = \begin{pmatrix} 1 & 1 \\ 1 & -1\end{pmatrix}$.

**Question 1 (linear transformations):** Write $[T]_E$, the matrix of $T$ in the standard basis.

*Answer:* The columns of a transformation's matrix are the images of the basis vectors. Reflection across $y = x$ swaps coordinates, so $T(e_1) = e_2$ and $T(e_2) = e_1$:

$$[T]_E = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$$

**Question 2 (change of basis):** Find $[T]_B$, and read off what it says geometrically.

*Answer:* $[T]_B = P^{-1}[T]_E P$. With $\det(P) = -2$, $P^{-1} = \begin{pmatrix} 1/2 & 1/2 \\ 1/2 & -1/2\end{pmatrix}$, and

$$[T]_B = \begin{pmatrix} 1/2 & 1/2 \\ 1/2 & -1/2\end{pmatrix}\begin{pmatrix} 0 & 1 \\ 1 & 0\end{pmatrix}\begin{pmatrix} 1 & 1 \\ 1 & -1\end{pmatrix} = \begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}$$

(verified). Geometrically: $v_1 = (1,1)$ lies **on** the mirror line, so it is fixed — hence the $+1$. $v_2 = (1,-1)$ is **perpendicular** to the mirror, so it flips — hence the $-1$. Sanity check on the invariants: $\text{tr} = 0$ and $\det = -1$ for both matrices ✓.

**Why this drill exists:** the misconception this targets is "the matrix **is** the transformation." It isn't — a matrix is a transformation *plus a choice of basis*. One reflection produced two completely different matrices here, $\begin{pmatrix} 0&1\\1&0\end{pmatrix}$ and $\begin{pmatrix} 1&0\\0&-1\end{pmatrix}$, and only the basis-free quantities (trace, determinant, eigenvalues) survived the change. Choosing the right basis is what turned an off-diagonal matrix into a diagonal one.
