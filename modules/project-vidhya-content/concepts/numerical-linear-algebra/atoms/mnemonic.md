---
id: numerical-linear-algebra.mnemonic
concept_id: numerical-linear-algebra
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Multipliers move down, into $L$."** Every multiplier computed during elimination lands directly below the diagonal in $L$, unchanged in sign; the diagonal of $L$ is always $1$'s, and $U$ is whatever elimination leaves behind above and on the diagonal.

**Worked check:** $\det(A)=\det(L)\det(U)$, and $\det(L)=1$ always (unit diagonal, triangular) — so $\det(A)$ must equal the product of $U$'s diagonal entries alone. For $A=\begin{pmatrix}2&1&1\\4&3&3\\8&7&9\end{pmatrix}$, $U$'s diagonal is $2,1,2$, product $4$ — and $\det A=4$, confirmed.

**Sanity-check reflex:** after computing any LU factorization, multiply $U$'s diagonal entries together; that product must equal $\det(A)$, computed independently — a fast, free check on the whole elimination.
