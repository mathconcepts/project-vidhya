---
id: quadratic-forms.formal_definition
concept_id: quadratic-forms
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

A **quadratic form** is a homogeneous degree-2 polynomial $f(\mathbf{x}) = \mathbf{x}^T A \mathbf{x}$ in $n$ variables, where $A$ is the unique $n\times n$ **symmetric** matrix representing it.

**Classification by definiteness:**
- **Positive definite:** $\mathbf{x}^T A \mathbf{x} > 0$ for all $\mathbf{x}\neq\mathbf{0}$ $\iff$ every eigenvalue $\lambda_i>0$
- **Positive semi-definite:** $\mathbf{x}^T A \mathbf{x}\geq0$ for all $\mathbf{x}$ $\iff$ every $\lambda_i\geq0$
- **Negative definite:** $\mathbf{x}^T A \mathbf{x}<0$ for all $\mathbf{x}\neq\mathbf{0}$ $\iff$ every $\lambda_i<0$
- **Indefinite:** the form takes both signs $\iff$ $A$ has eigenvalues of mixed sign

**Sylvester's criterion:** $A$ is positive definite iff every leading principal minor $D_k>0$, $k=1,\dots,n$.

**Method selector.** Reach for Sylvester's criterion when you only need to *confirm* positive definiteness and want a determinant-only check with no characteristic polynomial. The tempting-but-wrong alternative is reading definiteness off the diagonal entries alone: $A=\begin{pmatrix}1&2\\2&1\end{pmatrix}$ has both diagonal entries positive yet is indefinite ($\lambda=3,-1$) — off-diagonal coupling can flip the verdict, so the diagonal alone is never sufficient.
