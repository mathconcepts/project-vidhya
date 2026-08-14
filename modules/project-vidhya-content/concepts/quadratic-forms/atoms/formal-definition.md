---
id: quadratic-forms.formal_definition
concept_id: quadratic-forms
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Definition:** A quadratic form is a homogeneous polynomial of degree 2 in $n$ variables $\mathbf{x} = (x_1, \ldots, x_n)^T$, written as $f(\mathbf{x}) = \mathbf{x}^T A \mathbf{x}$ where $A$ is an $n \times n$ symmetric matrix. Every quadratic form has a unique symmetric matrix representation.

**Classification by Definiteness:**
- **Positive definite:** $\mathbf{x}^T A \mathbf{x} > 0$ for all $\mathbf{x} \neq \mathbf{0}$ ⟺ all eigenvalues $\lambda_i > 0$
- **Positive semi-definite:** $\mathbf{x}^T A \mathbf{x} \geq 0$ for all $\mathbf{x}$ ⟺ all $\lambda_i \geq 0$
- **Negative definite:** $\mathbf{x}^T A \mathbf{x} < 0$ for all $\mathbf{x} \neq \mathbf{0}$ ⟺ all $\lambda_i < 0$
- **Indefinite:** the form takes both positive and negative values ⟺ $A$ has eigenvalues of mixed signs

**Sylvester's Criterion:** $A$ is positive definite iff all leading principal minors are positive: $D_k > 0$ for $k = 1, 2, \ldots, n$.