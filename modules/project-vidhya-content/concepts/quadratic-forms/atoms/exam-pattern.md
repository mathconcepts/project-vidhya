---
id: quadratic-forms.exam-pattern
concept_id: quadratic-forms
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **MCQ: "which matrix represents this form?"** The distractor is always the *unhalved* one — cross-term coefficient dropped straight into $a_{ij}$ instead of split. Halve first, then read the options.

- **The uniqueness trap.** "Every quadratic form has a unique matrix" is only true *among symmetric matrices*. Infinitely many non-symmetric $B$ satisfy $\mathbf{x}^T B \mathbf{x} = f$, and GATE plants one as an option. If the question says "the symmetric matrix", halve; if it offers a triangular matrix that also reproduces $f$, it is testing whether you know the symmetric one is the only one whose eigenvalues mean anything.

- **NAT: rank, index, signature.** Classify the form via its *symmetric* matrix's eigenvalues:
  - rank = number of nonzero eigenvalues
  - index $p$ = number of positive eigenvalues
  - signature = $p - q$ (positives minus negatives)

  Example: $f = 2x^2 + 3y^2 + 4z^2 + 4xy + 4yz$ gives $A = \begin{pmatrix} 2 & 2 & 0 \\ 2 & 3 & 2 \\ 0 & 2 & 4 \end{pmatrix}$ with eigenvalues $6, 3, 0$ (verified: $6+3+0 = 9 = \text{tr}(A)$ ✓, product $= 0 = \det(A)$ ✓). So rank $2$, index $2$, signature $2$: **positive semi-definite, not positive definite.** Leading minors $2, 2, 0$ — that terminal zero is the tell.

- **Classify by *signs*, never magnitudes.** Eigenvalues $0.001$ and $500$ are both positive: positive definite. Eigenvalues $-0.001$ and $500$: indefinite. GATE writes options that reward reading the sign column and nothing else.

- **The homogeneity check.** A "quadratic form" with a linear term is a conic/quadric in disguise, not a form. Do not build a matrix from it directly.

- **Time budget:** building $A$ and applying leading minors on a $3\times3$ is a 90-second job. Only compute the full eigen-decomposition when the question wants the canonical form $\lambda_1 y_1^2 + \cdots + \lambda_n y_n^2$; for classification alone, the minors are faster.
