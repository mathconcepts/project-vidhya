---
id: jordan-normal-form.interleaved-drill
concept_id: jordan-normal-form
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: diagonalization → Jordan normal form.**

$D=\begin{pmatrix}3&0\\0&3\end{pmatrix}$ and $A=\begin{pmatrix}4&1\\-1&2\end{pmatrix}$ both have eigenvalue $3$ with algebraic multiplicity $2$ (verified: $\operatorname{tr}(D)=6=\operatorname{tr}(A)$, $\det(D)=9=\det(A)$).

**Question 1 (diagonalization):** Is $D$ diagonalizable, and what is $\dim\ker(D-3I)$?

*Answer:* $D-3I$ is the zero matrix, so $\ker(D-3I)=\mathbb{R}^2$: geometric multiplicity $2$ equals algebraic multiplicity $2$. $D$ is (trivially) diagonalizable — it already is diagonal.

**Question 2 (Jordan normal form):** Is $A$ diagonalizable? If not, what is its Jordan form?

*Answer:* $\operatorname{rank}(A-3I)=1$, so $\dim\ker(A-3I)=1<2$: geometric multiplicity falls short of algebraic multiplicity, so $A$ is defective. Its Jordan form is $J=\begin{pmatrix}3&1\\0&3\end{pmatrix}$.

**Why this drill exists:** same eigenvalue, same algebraic multiplicity, same trace and determinant — the only thing separating a diagonalizable matrix from one needing Jordan form is geometric multiplicity, which forces you to actually compute $\operatorname{rank}(A-\lambda I)$ rather than infer it from the repeated root.
