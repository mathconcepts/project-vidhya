---
id: change-of-basis.intuition
concept_id: change-of-basis
atom_type: intuition
bloom_level: 2
difficulty: 0.1
modality: visual
exam_ids: ["*"]
---

Take the hook's own example: $x=(3,1)$ in standard coordinates, and the basis $B=\{(1,1),(1,-1)\}$, where $[x]_B=(2,1)$. Same point $x$, two different pairs of numbers — because a basis is just a choice of ruler, and coordinates are what you read off it. $[x]_B$ answers "how many of each basis vector, added together, makes $x$?" — change the ruler, and the same $x$ gets a new reading, even though $x$ itself never moved.

The change-of-basis matrix $P=\begin{pmatrix}1&1\\1&-1\end{pmatrix}$ packages this translation as one matrix multiplication instead of solving a fresh pair of equations every time: its columns are the *new* basis vectors, written in the *old* (standard) coordinates. Multiplying by $P$ converts new-basis coordinates into old-basis coordinates ($P(2,1)=(3,1)$, check it); multiplying by $P^{-1}$ goes the other way.

This matters beyond bookkeeping. A linear transformation's matrix representation is basis-dependent — the same transformation $T$ can look like a messy matrix in the standard basis and a clean diagonal matrix in a basis built from its eigenvectors. Choosing the right basis is often the entire trick to a problem, not a formality before it.
