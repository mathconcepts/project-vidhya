---
id: cayley-hamilton.exam-pattern
concept_id: cayley-hamilton
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT: "find $A^{n}$" for $n$ large.** This is Cayley-Hamilton in disguise, and it is never asking you to multiply matrices $n$ times. Get the characteristic polynomial, turn it into a recurrence, reduce.

  For $A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$: $\text{tr}(A) = 4$, $\det(A) = 3$, so $A^2 = 4A - 3I$. Check: $A^2 = \begin{pmatrix} 5 & 4 \\ 4 & 5 \end{pmatrix}$ and $4A - 3I = \begin{pmatrix} 8 & 4 \\ 4 & 8 \end{pmatrix} - \begin{pmatrix} 3 & 0 \\ 0 & 3 \end{pmatrix} = \begin{pmatrix} 5 & 4 \\ 4 & 5 \end{pmatrix}$ ✓. Every higher power now collapses to $\alpha A + \beta I$ — the answer is always two numbers, never a fresh matrix product.

- **NAT: "express $A^{-1}$ as a polynomial in $A$."** Rearrange $p(A)=0$ so that $A$ times something equals a multiple of $I$. For the same matrix, $A^2 - 4A + 3I = 0 \Rightarrow A(4I - A) = 3I \Rightarrow A^{-1} = \frac{1}{3}(4I - A) = \frac{1}{3}\begin{pmatrix} 2 & -1 \\ -1 & 2 \end{pmatrix}$ ✓ — no adjugate, no cofactors.

- **MSQ trap — minimal vs characteristic polynomial.** Cayley-Hamilton says $p(A) = 0$; it does **not** say $p$ is the smallest polynomial that kills $A$. For $A = I_3$, $p(\lambda) = (\lambda-1)^3$ but $A - I = 0$ already. "The characteristic polynomial is the minimal polynomial" is a distractor, true only sometimes.

- **Sign-convention trap.** $\det(\lambda I - A)$ and $\det(A - \lambda I)$ differ by $(-1)^n$, so both give a valid identity — but the *coefficients* flip for odd $n$. Fix one convention (monic $\det(\lambda I - A)$ is safest) and read off $c_{n-1} = -\text{tr}(A)$, $c_0 = (-1)^n \det(A)$.

- **Time budget:** a $2\times2$ power-reduction or inverse question should cost under 60 seconds — trace, determinant, recurrence. If you are expanding a determinant symbolically on a $2\times2$, you have already lost the shortcut.
