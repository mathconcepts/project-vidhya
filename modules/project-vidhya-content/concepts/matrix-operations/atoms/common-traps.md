---
id: matrix-operations.common-traps
concept_id: matrix-operations
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Multiplication order matters**: Students often forget that $AB \neq BA$ in general. Matrix multiplication is NOT commutative. Only $AB = BA$ in very special cases (e.g., one is a scalar multiple of the identity).
- **Dimension mismatch**: Forgetting that $A$ must have dimensions $m \times n$ and $B$ must be $n \times p$ for the product $AB$ to exist. A common error is attempting to multiply incompatible matrices.
- **Confusing $(AB)^T = B^T A^T$ with $(AB)^T = A^T B^T$**: The transpose reverses the order — this trips up many students because the order matters during matrix multiplication.
