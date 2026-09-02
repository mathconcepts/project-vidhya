---
id: matrix-norms.interleaved-drill
concept_id: matrix-norms
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: SVD → matrix norms.**

$A=\begin{pmatrix}4&1\\0&2\end{pmatrix}$. $A^TA=\begin{pmatrix}16&4\\4&5\end{pmatrix}$ has eigenvalues $\approx17.30,\,3.70$ (verified: sum $=21=\operatorname{tr}(A^TA)$, product $\approx64=\det(A^TA)$).

**Question 1 (SVD):** What are the singular values of $A$?

*Answer:* $\sigma_i=\sqrt{\lambda_i(A^TA)}$, so $\sigma_1\approx\sqrt{17.30}\approx4.16$ and $\sigma_2\approx\sqrt{3.70}\approx1.92$ — exactly the diagonal entries $\Sigma$ would carry in $A=U\Sigma V^T$.

**Question 2 (matrix norms):** Using those singular values, find $\|A\|_2$ and $\kappa_2(A)$.

*Answer:* $\|A\|_2=\sigma_{\max}\approx4.16$; $\kappa_2(A)=\sigma_{\max}/\sigma_{\min}\approx4.16/1.92\approx2.16$.

**Why this drill exists:** matrix norms and SVD are computed from the exact same numbers — students who memorize $\|A\|_2$ and $\kappa_2$ as separate "norm formulas" rather than "singular values, reused" end up recomputing $A^TA$'s eigenvalues twice under exam pressure instead of once.
