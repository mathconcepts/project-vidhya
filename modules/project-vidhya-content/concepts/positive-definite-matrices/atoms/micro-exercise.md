---
id: positive-definite-matrices.micro-exercise
concept_id: positive-definite-matrices
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

**Question:** For the matrix $A = \begin{pmatrix} 3 & 1 \\ 1 & 2 \end{pmatrix}$, which of the following is true?

**(A)** $A$ is positive definite  
**(B)** $A$ is positive semidefinite but not positive definite  
**(C)** $A$ is indefinite  
**(D)** $A$ is negative definite  

<details><summary>Answer</summary>

Apply Sylvester's criterion:
- $D_1 = 3 > 0$ ✓
- $D_2 = \det(A) = (3)(2) - (1)(1) = 6 - 1 = 5 > 0$ ✓

Both leading principal minors are positive, so $A$ is **positive definite**. 

**Answer: (A)**

*Verification:* Eigenvalues are $\lambda = \frac{5 \pm \sqrt{25 - 24}}{2} = \frac{5 \pm 1}{2}$, giving $\lambda_1 = 3, \lambda_2 = 2$ (both positive) ✓

</details>