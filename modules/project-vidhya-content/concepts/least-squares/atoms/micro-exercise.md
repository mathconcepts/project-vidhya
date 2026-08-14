---
id: least-squares.micro_exercise
concept_id: least-squares
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

Which of the following is NOT a property of the least squares solution $\hat{x}$ to $Ax = b$ (where $A$ is $m \times n$, $m > n$)?

(A) $\hat{x}$ minimizes $\|b - Ax\|^2$

(B) $\hat{x}$ satisfies $A^T A \hat{x} = A^T b$

(C) $\hat{x}$ satisfies $A\hat{x} = b$ exactly

(D) The residual $\hat{r} = b - A\hat{x}$ is orthogonal to $\text{col}(A)$

<details>
<summary>Answer</summary>

**(C)** is NOT a property. For an overdetermined system, there is no $x$ that satisfies $Ax = b$ exactly (unless $b$ lies in $\text{col}(A)$, which is rare). The least squares solution finds the best approximation, not an exact solution.

(A), (B), and (D) are all correct properties of $\hat{x}$.

</details>