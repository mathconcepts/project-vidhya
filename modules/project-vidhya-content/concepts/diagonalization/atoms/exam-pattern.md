---
id: diagonalization.exam-pattern
concept_id: diagonalization
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT: "find $\text{tr}(A^k)$" or "$\det(A^k)$" — and you never need $P$ at all.** Diagonalization tells you the eigenvalues of $A^k$ are $\lambda_i^k$, so

  $$\text{tr}(A^k) = \sum \lambda_i^k, \qquad \det(A^k) = \prod \lambda_i^k = (\det A)^k$$

  For the concept's own $A = \begin{pmatrix} 4 & 1 \\ 2 & 3\end{pmatrix}$ with $\lambda = 5, 2$: $\text{tr}(A^3) = 125 + 8 = 133$ and $\det(A^3) = 10^3 = 1000$ — both verified against $A^3 = \begin{pmatrix} 86 & 39 \\ 78 & 47\end{pmatrix}$ ✓. Computing $P$, $D^3$ and $P^{-1}$ to get the same two numbers costs five minutes you do not have.

  Only when the question wants the **full matrix** $A^k$ do you actually build $P D^k P^{-1}$.

- **MSQ: "which of the following are diagonalizable?"** Work the options in this order — it is fastest:
  1. Real symmetric → yes, immediately, no computation.
  2. $n$ distinct eigenvalues → yes, immediately.
  3. Already diagonal or a scalar multiple of $I$ → yes, trivially.
  4. Repeated eigenvalue and none of the above → **now** compute $\text{rank}(A - \lambda I)$ and compare $\text{GM} = n - \text{rank}$ against AM.
  5. Nonzero nilpotent ($A^k = 0$) → **never** diagonalizable. Its only eigenvalue is $0$, so $D = 0$, which would force $A = P\,0\,P^{-1} = 0$.

- **Trap: diagonalizable and invertible are unrelated.** $\text{diag}(0,1)$ is diagonalizable and singular; $\begin{pmatrix} 1 & 1 \\ 0 & 1\end{pmatrix}$ is invertible and not diagonalizable. Any option that treats one as implying the other is a distractor.

- **Trap: eigenvalues alone never settle it.** Two matrices with the *same* characteristic polynomial can differ — one diagonalizable, one not. See the paired drill for a worked instance of exactly that.

- **Time budget:** deciding diagonalizability for a $3\times3$ is one rank computation, under 90 seconds. Producing the full $P$, $D$, $P^{-1}$ triple runs 4–5 minutes — so before you start, re-read the question and check it actually asked for the matrix.
