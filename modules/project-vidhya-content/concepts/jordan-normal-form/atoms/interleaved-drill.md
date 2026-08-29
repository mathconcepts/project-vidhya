---
id: jordan-normal-form.interleaved-drill
concept_id: jordan-normal-form
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: jordan-normal-form.micro_exercise
---

**Cross-concept check: diagonalization fails → Jordan form catches it.**

$A = \begin{pmatrix} 4 & 1 \\ -1 & 2 \end{pmatrix}$. Characteristic polynomial $(\lambda - 3)^2$, so $\lambda = 3$ with algebraic multiplicity 2 (verified; sanity check: $\text{tr}(A) = 6 = 3 + 3$ ✓, $\det(A) = 8 + 1 = 9 = 3 \cdot 3$ ✓).

**Question 1 (diagonalization):** Is $A$ diagonalizable?

*Answer:* No. $A - 3I = \begin{pmatrix} 1 & 1 \\ -1 & -1 \end{pmatrix}$ has rank 1, so the eigenspace has dimension $2 - 1 = 1$. Geometric multiplicity $1 <$ algebraic multiplicity $2$, so $A$ is **defective** — there is no basis of eigenvectors, and no $P$ with $P^{-1}AP$ diagonal exists.

**Question 2 (Jordan normal form):** Then what *do* you get, and what is it good for?

*Answer:* Geometric multiplicity 1 means exactly **one** block; its size must be the algebraic multiplicity 2:

$$J = \begin{pmatrix} 3 & 1 \\ 0 & 3 \end{pmatrix}, \qquad A = PJP^{-1} \text{ with } P = \begin{pmatrix} 1 & 0 \\ -1 & 1 \end{pmatrix}$$

(verified: $AP = PJ = \begin{pmatrix} 3 & 1 \\ -3 & 2 \end{pmatrix}$). Minimal polynomial $(x-3)^2$ — the largest block size is 2.

The payoff is that powers stay easy. $J^n = \begin{pmatrix} 3^n & n\,3^{\,n-1} \\ 0 & 3^n \end{pmatrix}$ (verified), so $A^n = PJ^nP^{-1}$ — the same trick diagonalization gives you, one degree messier.

**Why this drill exists:** students hear "not diagonalizable" as "dead end" and stop. It isn't. Diagonalization is the special case where every Jordan block has size 1; Jordan form is the general answer that always exists over $\mathbb{C}$, and it still delivers powers, exponentials, and the minimal polynomial. The failure of one is the entry point to the other, not the end of the question.
