---
id: change-of-basis.interleaved-drill
concept_id: change-of-basis
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
tested_by_atom: change-of-basis.micro-exercise
---

**Cross-concept check: change of basis → linear transformations.**

The transformation $T$ has matrix $A=\begin{pmatrix}2&1\\1&2\end{pmatrix}$ in the standard basis. Let $B=\{v_1,v_2\}$ with $v_1=(1,1)$, $v_2=(1,-1)$, so $P=\begin{pmatrix}1&1\\1&-1\end{pmatrix}$.

**Question 1 (change of basis):** Compute $[T]_B = P^{-1}AP$.

*Answer:* $P^{-1}=\begin{pmatrix}0.5&0.5\\0.5&-0.5\end{pmatrix}$. Working through the product: $AP=\begin{pmatrix}3&1\\3&-1\end{pmatrix}$, then $P^{-1}(AP)=\begin{pmatrix}3&0\\0&1\end{pmatrix}$ (verified). $[T]_B$ is **diagonal**.

**Question 2 (linear transformations):** Why did that happen — is it a coincidence of this particular $A$?

*Answer:* No. $B$'s vectors are exactly $A$'s eigenvectors: $Av_1 = (3,3) = 3v_1$ and $Av_2 = (1,-1) = 1v_2$, so the eigenvalues $3,1$ land directly on the diagonal. The same transformation $T$, described in the standard basis, looks like a matrix with off-diagonal entries; described in its own eigenbasis, it looks like pure per-axis scaling. Nothing about $T$ changed — only which basis is doing the describing.

**Why this drill exists:** students treat "find $[T]_B$" as a mechanical $P^{-1}AP$ exercise disconnected from eigenvalues, and re-derive eigenvectors from scratch when a question already handed them a basis. Recognizing that a given basis IS an eigenbasis — by checking $Av_i \parallel v_i$ before multiplying anything — turns a three-matrix computation into reading the eigenvalues off the given vectors directly.
