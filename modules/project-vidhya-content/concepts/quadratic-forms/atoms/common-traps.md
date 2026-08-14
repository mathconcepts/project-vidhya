---
id: quadratic-forms.common_traps
concept_id: quadratic-forms
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Forgetting to symmetrize the matrix**

If the quadratic form is $x^2 + 4xy + y^2$, many students write $A = \begin{pmatrix} 1 & 4 \\ 4 & 1 \end{pmatrix}$. The correct matrix is $A = \begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$ because the off-diagonal entry must be $4/2 = 2$. The coefficient 4 on $xy$ is shared equally between the two off-diagonal positions.

**Trap 2: Confusing the sign of the eigenvalues with the sign of the form**

A quadratic form is positive definite iff **all** eigenvalues are strictly positive. If even one eigenvalue is zero or negative, it is not positive definite. Many students incorrectly assume a form with large positive entries in the diagonal must be positive definite—but $\begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$ has one eigenvalue equal to 3 and one equal to $-1$, so it is indefinite.

**Trap 3: Thinking the matrix is not unique**

Some students ask: "Doesn't the quadratic form have many matrix representations?" The answer is no—there is a **unique symmetric matrix** for any quadratic form. If you use a non-symmetric matrix $B$, then $(B + B^T)/2$ gives the unique symmetric form, and this is what you must use for definiteness classification.

**Trap 4: Misapplying Sylvester's criterion**

Sylvester's criterion says $A$ is positive definite iff **all leading principal minors are positive**. A common error is checking only the determinant $\det(A)$: a positive determinant is necessary but not sufficient. Example: $A = \begin{pmatrix} -1 & 0 \\ 0 & -1 \end{pmatrix}$ has $\det(A) = 1 > 0$ but is negative definite. You must check $D_1 = -1 < 0$, which fails Sylvester.