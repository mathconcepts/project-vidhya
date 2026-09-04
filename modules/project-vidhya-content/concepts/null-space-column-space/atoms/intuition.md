---
id: null-space-column-space.intuition
concept_id: null-space-column-space
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

Take the matrix from the animation above, $C=\begin{pmatrix}1&-1\\-1&1\end{pmatrix}$. Feed it a direction, and one of two things happens: either it lands on the shared line every output lands on, or it vanishes to nothing.

The **null space** is the set of directions that vanish — the matrix's blind spot. Here, $C\begin{pmatrix}1\\1\end{pmatrix}=\begin{pmatrix}0\\0\end{pmatrix}$: that direction disappears completely, exactly like the arrow that shrank to the centre dot in the animation.

The **column space** is the opposite question: what can the matrix actually produce? Here, $C\begin{pmatrix}1\\-1\end{pmatrix}=\begin{pmatrix}2\\-2\end{pmatrix}$ — every output lands somewhere on the line through $(1,-1)$, the same line the animation traced.

The rank-nullity theorem ties the two together: add the dimension of the null space to the dimension of the column space, and you always get the number of columns going in. Here, $1+1=2$ — one direction survives into the column space, one direction is swallowed by the null space, and together they account for the whole plane.