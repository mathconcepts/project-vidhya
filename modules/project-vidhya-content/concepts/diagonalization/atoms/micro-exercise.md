---
id: diagonalization.micro-exercise
concept_id: diagonalization
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Is the matrix $A = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ diagonalizable?

- **(A)** Yes, it is diagonalizable
- **(B)** No, it is not diagonalizable
- **(C)** Cannot determine
- **(D)** Only if we allow complex numbers

<details>
<summary>Answer</summary>

**B**. The characteristic polynomial is:
$\det(A - \lambda I) = \det \begin{pmatrix} 1 - \lambda & 1 \\ 0 & 1 - \lambda \end{pmatrix} = (1 - \lambda)^2 = 0$.

So $\lambda = 1$ is the only eigenvalue, with algebraic multiplicity 2.

Find the eigenspace for $\lambda = 1$:
$(A - I)\mathbf{v} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}\mathbf{v} = \mathbf{0}$ gives $v_2 = 0$.

The eigenspace is $\text{span}\{(1, 0)\}$, which has dimension 1 (geometric multiplicity = 1).

Since geometric multiplicity (1) $<$ algebraic multiplicity (2), the matrix is not diagonalizable. This is the Jordan normal form case—it would require a Jordan block.

</details>
