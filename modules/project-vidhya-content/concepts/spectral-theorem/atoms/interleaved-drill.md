---
id: spectral-theorem.interleaved-drill
concept_id: spectral-theorem
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: spectral-theorem.micro-exercise
---

**Cross-concept check: spectral theorem → symmetric matrices.**

$A = \begin{pmatrix} 5 & 2 \\ 2 & 5 \end{pmatrix}$ is symmetric, with eigenvalues $3$ and $7$ (verified: $3+7 = 10 = \text{tr}(A)$ ✓, $3 \cdot 7 = 21 = \det(A)$ ✓).

**Question 1 (spectral theorem):** Build $Q$, then compute $A^3$ using $A^3 = Q\Lambda^3 Q^{\mathrm{T}}$.

*Answer:* For $\lambda = 3$: $(A - 3I) = \begin{pmatrix} 2 & 2 \\ 2 & 2 \end{pmatrix}$ gives $\mathbf{q}_1 = \frac{1}{\sqrt{2}}(1, -1)^{\mathrm{T}}$. For $\lambda = 7$: $(A - 7I) = \begin{pmatrix} -2 & 2 \\ 2 & -2 \end{pmatrix}$ gives $\mathbf{q}_2 = \frac{1}{\sqrt{2}}(1, 1)^{\mathrm{T}}$. Their dot product is $\frac{1}{2}(1 - 1) = 0$ — automatic, not arranged.

$$A^3 = 27\,\mathbf{q}_1\mathbf{q}_1^{\mathrm{T}} + 343\,\mathbf{q}_2\mathbf{q}_2^{\mathrm{T}} = \tfrac{27}{2}\begin{pmatrix} 1 & -1 \\ -1 & 1\end{pmatrix} + \tfrac{343}{2}\begin{pmatrix} 1 & 1 \\ 1 & 1\end{pmatrix} = \begin{pmatrix} 185 & 158 \\ 158 & 185 \end{pmatrix}$$

(verified against direct cubing.) Note what was *not* needed: an inverse. Only a transpose.

**Question 2 (symmetric matrices):** Now take $C = \begin{pmatrix} 3 & 1 \\ 0 & 7 \end{pmatrix}$ — same eigenvalues $3$ and $7$, distinct, so $C$ *is* diagonalizable. Is it **orthogonally** diagonalizable?

*Answer:* Eigenvectors are $(1,0)^{\mathrm{T}}$ for $\lambda = 3$ and $(1,4)^{\mathrm{T}}$ for $\lambda = 7$ (verified). Their dot product is $1 \neq 0$ — **not orthogonal**. So $C = PDP^{-1}$ exists, but $P^{-1} \neq P^{\mathrm{T}}$: you must genuinely invert $P$. And no other eigenbasis fixes this — the eigenvectors are determined up to scaling, and scaling cannot make a nonzero dot product vanish. $C$ is not symmetric, so it does not get the strong guarantee.

**Why this drill exists:** the misconception is "distinct eigenvalues ⇒ orthogonally diagonalizable." Distinct eigenvalues buy you a *basis* of eigenvectors — that is all. Only symmetry buys you an **orthonormal** one, and that is precisely what turns the expensive $P^{-1}$ into a free $Q^{\mathrm{T}}$. Symmetry is the hypothesis doing the work in every spectral shortcut you will use in the exam.
