# Teaching Tips: Determinants

## Common Student Errors
- **Sign errors in cofactor expansion**: Students forget the alternating sign pattern (+, -, +, -, ...) in cofactor expansion. The cofactor of element $a_{ij}$ has sign $(-1)^{i+j}$.
- **Confusing 2×2 and 3×3 scaling**: When scaling a matrix by scalar $c$, the determinant scales by $c^n$ (where $n$ is the matrix size). So $\det(2A)$ for a $2 \times 2$ matrix $A$ is $4 \det(A)$, not $2 \det(A)$.
- **Ignoring zero rows/columns**: If a matrix has a row or column of all zeros, $\det(A) = 0$ immediately — no need to compute anything else. Students often overlook this fast check.

## GATE Question Pattern
GATE determinant questions typically ask: (1) direct computation of 2×2 or 3×3 determinants; (2) application of properties ($\det(AB) = \det(A)\det(B)$, $\det(cA) = c^n \det(A)$, $\det(A^T) = \det(A)$); (3) finding when a matrix is singular; (4) using Cramer's rule to solve systems. Most are MCQ with one answer, though NAT questions on determinant values appear occasionally.

## Speed Tricks for MCQs
- **Use row operations first**: If you can reduce the matrix to upper triangular form via row operations (without swapping), the determinant equals the product of diagonal entries. Each row operation has a known effect on the determinant: adding a multiple of one row to another doesn't change $\det$; swapping rows multiplies $\det$ by -1.
- **Expand along zeros**: Always expand (cofactor) along the row or column with the most zeros to minimize calculations.
- **Spot patterns**: Diagonal, triangular, or orthogonal matrices have easy determinants ($\det(D) = $ product of diagonal entries for diagonal $D$; for orthogonal $A$, $\det(A) = \pm 1$).

## Must-Memorize Formulas / Results
- **2×2 determinant**: $\det \begin{pmatrix} a & b \\ c & d \end{pmatrix} = ad - bc$
- **Product property**: $\det(AB) = \det(A) \det(B)$
- **Scalar multiplication**: $\det(cA) = c^n \det(A)$ for $n \times n$ matrix $A$
- **Transpose**: $\det(A^T) = \det(A)$
- **Inverse**: $\det(A^{-1}) = \frac{1}{\det(A)}$ (if $A$ is invertible)
- **Singular condition**: $\det(A) = 0 \iff$ matrix is singular (rows/columns linearly dependent)
- **Row operations effect**: Swapping rows multiplies determinant by -1; adding a multiple of one row to another leaves determinant unchanged
- **Triangular matrices**: For upper/lower triangular $T$, $\det(T) = $ product of diagonal entries
