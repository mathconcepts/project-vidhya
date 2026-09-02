---
id: determinants.exam-pattern
concept_id: determinants
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **MCQ/MSQ: the property table.** These are recall marks, not computation marks. Know all of them cold:
  - $\det(AB) = \det(A)\det(B)$, and $\det(A^T) = \det(A)$
  - $\det(kA) = k^n \det(A)$ for an $n\times n$ matrix — **the single most-set trap on this topic**
  - $\det(A^{-1}) = 1/\det(A)$
  - Triangular (and block-triangular) → product of the diagonal (or diagonal blocks)
  - $\det(A + B) \neq \det(A) + \det(B)$ — determinant is **not** linear in the matrix

  Grounding the trap: for $A = \begin{pmatrix} 2 & 1 & -1 \\ 1 & 3 & 2 \\ -1 & 2 & 0\end{pmatrix}$, $\det(A) = -15$. Then $\det(2A) = 2^3 \cdot (-15) = -120$, **not** $-30$.

- **NAT: a $3\times3$ integer matrix, "find the determinant."** Do not reflexively expand along row 1. Scan for the row or column with the most zeros; if none exists, use the free row operation (**ADD** a multiple of one row to another) to manufacture one first.

- **NAT: a determinant with a parameter,** e.g. "for what $k$ is the system singular?" This is $\det = 0$ solved for $k$ — expand symbolically, set to zero. Do not solve the system.

- **Trap: singular does not mean small.** $\det = 0$ is a hard yes/no on invertibility, not a size measurement. A matrix with $\det = 10^{-6}$ is invertible.

- **Time budget:** under 60 seconds for a $3\times3$ that contains a zero, under 90 with one row operation to make one.
