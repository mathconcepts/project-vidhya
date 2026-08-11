# Teaching Tips: Matrix Operations

## Common Student Errors
- **Multiplication order matters**: Students often forget that $AB \neq BA$ in general. Matrix multiplication is NOT commutative. Only $AB = BA$ in very special cases (e.g., one is a scalar multiple of the identity).
- **Dimension mismatch**: Forgetting that $A$ must have dimensions $m \times n$ and $B$ must be $n \times p$ for the product $AB$ to exist. A common error is attempting to multiply incompatible matrices.
- **Confusing $(AB)^T = B^T A^T$ with $(AB)^T = A^T B^T$**: The transpose reverses the order — this trips up many students because the order matters during matrix multiplication.

## GATE Question Pattern
GATE tests rapid 2×2 and 3×3 matrix operations, particularly: (1) computing specific entries of products; (2) verifying algebraic identities like $(AB)^T = B^T A^T$ or $(ABC)^T = C^T B^T A^T$; (3) identifying when matrices commute or are orthogonal. Most questions are MCQ with one numerical answer per part.

## Speed Tricks for MCQs
- **Only compute the entries you need**: If asked for the (1,2) entry of $AB$, compute only row 1 of $A$ times column 2 of $B$ — don't compute the entire product.
- **Check dimension compatibility first**: Before computing, verify the matrix dimensions match the required operation. If they don't, the answer is "undefined" or "not possible."
- **Use symmetry and special forms**: If $A$ or $B$ is diagonal, triangular, or has lots of zeros, leverage that structure to skip computations. E.g., for diagonal $D$, $(DA)_{ij} = D_{ii} A_{ij}$.

## Must-Memorize Formulas / Results
- **Matrix multiplication**: $(AB)_{ij} = \sum_{k=1}^{n} A_{ik} B_{kj}$
- **Transpose property**: $(AB)^T = B^T A^T$ (order reverses)
- **Double transpose**: $(A^T)^T = A$
- **Sum of transpose**: $(A + B)^T = A^T + B^T$
- **Scalar multiple transpose**: $(cA)^T = c A^T$
- **Identity matrix**: $AI = IA = A$ for any compatible $A$
- **Trace property**: $\text{tr}(AB) = \text{tr}(BA)$ (trace is invariant under cyclic permutation)
