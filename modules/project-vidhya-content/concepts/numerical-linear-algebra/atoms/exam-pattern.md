---
id: numerical-linear-algebra.exam-pattern
concept_id: numerical-linear-algebra
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT/MCQ questions** give a small matrix (2×2 or 3×3) and ask for a specific entry of $L$ or $U$, or the full solution vector $x$ after LU-based forward/back substitution.
- **MCQ questions** often test whether Jacobi/Gauss-Seidel convergence conditions are satisfied — "is this system diagonally dominant?" — before any iteration is asked for.
- **A frequent MCQ pattern:** "Factor $A=\begin{pmatrix}2&4\\3&5\end{pmatrix}$ into $LU$" — worked exactly as $m_{21}=3/2=1.5$, giving $U=\begin{pmatrix}2&4\\0&-1\end{pmatrix}$, $L=\begin{pmatrix}1&0\\1.5&1\end{pmatrix}$.
- **A frequent conceptual pattern:** stating $\kappa(A)$ for a given matrix and asking how many digits of accuracy are lost — the rule of thumb is roughly $\log_{10}\kappa(A)$ digits.

**Time budget:** a 2×2 or 3×3 LU-and-solve item runs 3–4 minutes if the multipliers and substitutions are written out row by row rather than mentally.
