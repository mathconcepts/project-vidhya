---
id: eigenvalues.exam-pattern
concept_id: eigenvalues
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions rarely want the full characteristic polynomial.** If the question asks for the *sum* or *product* of eigenvalues, that's trace and determinant — read them off in one line, don't factor a cubic to get there.

  Example: for $A = \begin{pmatrix} 2 & 0 & 0 \\ 0 & 3 & 1 \\ 0 & 1 & 3 \end{pmatrix}$, "sum of eigenvalues" $= \text{tr}(A) = 8$ directly — no need to solve for the individual eigenvalues ($4, 2, 2$) first, verified: $4+2+2=8$ ✓, $4\cdot2\cdot2=16=\det(A)$ ✓.

- **MCQ/MSQ "property" questions test standard facts, not computation:**
  - $A$ and $A^T$ have the same eigenvalues.
  - Eigenvalues of a triangular matrix are its diagonal entries — no computation needed at all.
  - If $\lambda$ is an eigenvalue of $A$, then $\lambda^k$ is an eigenvalue of $A^k$, and $1/\lambda$ is an eigenvalue of $A^{-1}$ (when $A$ is invertible).
  - A real symmetric matrix always has real eigenvalues — this is a common "which of the following is guaranteed" distractor filter.

- **Repeated eigenvalues are a trap, not a dead end.** GATE likes matrices with a repeated eigenvalue specifically to test whether you'll assume it blocks diagonalizability. It doesn't, automatically — check eigenspace dimension (see the paired drill on diagonalization).

- **Time budget:** a clean $2\times2$ or $3\times3$ integer-entry eigenvalue problem should cost under 90 seconds using the trace/det shortcut. If you're past two minutes still expanding a determinant by hand, you've missed a shortcut — stop and look for one before continuing.
