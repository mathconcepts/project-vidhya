---
id: lu-factorization.interleaved-drill
concept_id: lu-factorization
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
modality: drill
exam_ids: ["*"]
tested_by_atom: lu-factorization.micro_exercise
---

**Cross-concept check: LU factorization → positive-definite matrices.**

$A=\begin{pmatrix}4&2\\2&3\end{pmatrix}$ is symmetric. Its Doolittle factorization: $u_{11}=4$, $\ell_{21}=2/4=1/2$, $u_{22}=3-(1/2)(2)=2$ — verified: $\begin{pmatrix}1&0\\1/2&1\end{pmatrix}\begin{pmatrix}4&2\\0&2\end{pmatrix}=\begin{pmatrix}4&2\\2&3\end{pmatrix}=A$.

**Question 1 (LU → definiteness):** Both pivots, $u_{11}=4$ and $u_{22}=2$, came out positive with no row swap needed. What does that alone tell you about $A$?

*Answer:* For a symmetric matrix, an LU factorization (no pivoting) with every diagonal pivot of $U$ positive is exactly the $LDL^\top$ certificate of positive definiteness — the pivots ARE the diagonal entries of $D$ in $A=LDL^\top$, and $D>0$ entrywise iff $A$ is positive definite. So $A$ here is positive definite, confirmed structurally, with no eigenvalues or minors computed separately.

**Question 2 (definiteness → LU):** If instead a symmetric matrix hit a negative pivot partway through elimination, what would that mean?

*Answer:* A negative pivot means $D$ has a negative diagonal entry, so $A=LDL^\top$ has mixed-sign quadratic form values — $A$ is indefinite (or negative definite if every pivot is negative), never positive definite. The elimination itself becomes the definiteness test, no separate check required.

**Why this drill exists:** students treat "factor $A$" and "test positive definiteness" as unrelated procedures needing separate machinery (eigenvalues here, Gaussian elimination there). For a symmetric matrix they are the same arithmetic read two ways — this drill targets that missing link directly.
