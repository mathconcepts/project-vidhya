---
id: quadratic-forms.micro_exercise
concept_id: quadratic-forms
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

**Question:** The quadratic form $f(x, y, z) = x^2 + y^2 - z^2 + 2xy$ can be represented as $\mathbf{x}^T A \mathbf{x}$ where:

$$(A) \quad A = \begin{pmatrix} 1 & 1 & 0 \\ 1 & 1 & 0 \\ 0 & 0 & -1 \end{pmatrix}$$

$$(B) \quad A = \begin{pmatrix} 1 & 2 & 0 \\ 2 & 1 & 0 \\ 0 & 0 & -1 \end{pmatrix}$$

$$(C) \quad A = \begin{pmatrix} 1 & 1 & 0 \\ 1 & 1 & 0 \\ 0 & 0 & 1 \end{pmatrix}$$

$$(D) \quad A = \begin{pmatrix} 2 & 1 & 0 \\ 1 & 2 & 0 \\ 0 & 0 & 1 \end{pmatrix}$$

What is the classification of this quadratic form?

<details><summary>Answer</summary>

The correct matrix is **(A)**. The symmetric matrix is:
$$A = \begin{pmatrix} 1 & 1 & 0 \\ 1 & 1 & 0 \\ 0 & 0 & -1 \end{pmatrix}$$

(Off-diagonal entries are half the cross-term coefficients: $2xy/2 = 1$.)

To classify, find eigenvalues. The $3 \times 3$ form has eigenvalues $\lambda = 0, 2, -1$ (the $2 \times 2$ upper-left block $\begin{pmatrix} 1 & 1 \\ 1 & 1 \end{pmatrix}$ has eigenvalues 0 and 2; the bottom-right is $-1$).

Since eigenvalues include both positive and negative, the form is **indefinite**.

</details>