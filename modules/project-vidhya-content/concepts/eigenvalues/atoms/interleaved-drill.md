---
id: eigenvalues.interleaved-drill
concept_id: eigenvalues
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: eigenvalues.micro-exercise
---

**Cross-concept check: eigenvalues → diagonalization.**

$A = \begin{pmatrix} 2 & 0 & 0 \\ 0 & 3 & 1 \\ 0 & 1 & 3 \end{pmatrix}$ has eigenvalues $4, 2, 2$ (verified: $\text{tr}(A) = 8 = 4+2+2$, $\det(A) = 16 = 4 \cdot 2 \cdot 2$).

**Question 1 (eigenvalues):** $\lambda = 2$ is repeated (algebraic multiplicity 2). Does that alone tell you whether $A$ is diagonalizable?

*Answer:* No — algebraic multiplicity only counts how many times a root appears in the characteristic polynomial. Diagonalizability depends on **geometric** multiplicity: the dimension of the eigenspace $\ker(A - 2I)$.

**Question 2 (diagonalization):** Find $\ker(A - 2I)$ and check its dimension against the algebraic multiplicity of $\lambda=2$.

*Answer:* $A - 2I = \begin{pmatrix} 0&0&0\\0&1&1\\0&1&1\end{pmatrix}$, rank 1, so $\dim\ker(A-2I) = 3 - 1 = 2$ — matches the algebraic multiplicity exactly. Geometric = algebraic for every eigenvalue here (the $\lambda=4$ eigenspace is trivially 1-dimensional), so $A$ **is** diagonalizable, with $A = PDP^{-1}$ for $D = \text{diag}(4,2,2)$.

**Why this drill exists:** a repeated eigenvalue is the single most common place students wrongly assume "repeated root ⇒ not diagonalizable." The correct check is always geometric vs. algebraic multiplicity, not the repetition itself — this matrix is a worked counterexample to the wrong shortcut.
