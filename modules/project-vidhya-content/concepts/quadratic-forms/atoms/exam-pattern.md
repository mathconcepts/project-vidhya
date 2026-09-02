---
id: quadratic-forms.exam-pattern
concept_id: quadratic-forms
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
modality: text
exam_ids: ["*"]
---

**How GATE actually asks this.**

- **MCQ: "which matrix represents this form?"** The distractor is always the *unhalved* one — cross-term coefficient dropped straight into $a_{ij}$ instead of split. Halve first, then read the options.

- **The uniqueness trap.** "Every quadratic form has a unique matrix" is only true *among symmetric matrices*. Infinitely many non-symmetric $B$ satisfy $\mathbf{x}^TB\mathbf{x}=f$; GATE plants one as an option to test whether you know only the symmetric one's eigenvalues mean anything.

- **NAT: rank, index, signature.** Classify via the symmetric matrix's eigenvalues: rank = nonzero eigenvalues, index $p$ = positive eigenvalues, signature $=p-q$.

  Example: $f=2x^2+3y^2+4z^2+4xy+4yz$ gives $A=\begin{pmatrix}2&2&0\\2&3&2\\0&2&4\end{pmatrix}$ with eigenvalues $6,3,0$ (verified: $6+3+0=9=\text{tr}(A)$ ✓, product $0=\det(A)$ ✓). Rank $2$, index $2$, signature $2$: **positive semi-definite**, not positive definite — the terminal zero is the tell.

- **Classify by *signs*, never magnitudes.** Eigenvalues $0.001$ and $500$ are both positive: positive definite. Eigenvalues $-0.001$ and $500$: indefinite.

- **The homogeneity check.** A "quadratic form" with a linear term is a conic in disguise, not a form — do not build a matrix from it directly.

- **Time budget:** building $A$ and applying leading minors on a $3\times3$ is a 90-second job. Only run the full eigen-decomposition when the canonical form itself is asked for.
