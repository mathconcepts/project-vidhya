# Teaching Tips: Diagonalization

## Common Student Errors
- **Confusing necessary and sufficient conditions**: A matrix is diagonalizable iff geometric multiplicity = algebraic multiplicity for EACH eigenvalue, not just one. Students often check only one eigenvalue.
- **Thinking all matrices are diagonalizable**: Jordan normal form matrices (like upper triangular with repeated diagonal entries) are not diagonalizable. Only if eigenvectors span the full space.
- **Forgetting that $P$ must be invertible**: The columns of $P$ must be linearly independent eigenvectors. If they're dependent, $P$ is singular and $P^{-1}$ doesn't exist.

## GATE Question Pattern
GATE diagonalization questions test: (1) determining if a matrix is diagonalizable (checking geometric = algebraic multiplicities); (2) finding the diagonal form $D$ and eigenvector matrix $P$; (3) using diagonalization to compute $A^k$ efficiently; (4) recognizing symmetric matrices as automatically diagonalizable. Most are MCQ identifying diagonalizability or computing powers.

## Speed Tricks for MCQs
- **Symmetric matrix shortcut**: If the matrix is symmetric, it's automatically diagonalizable—no need to check multiplicities.
- **Diagonal and triangular**: A diagonal matrix is already diagonalized. An upper/lower triangular matrix is diagonalizable iff all diagonal entries are distinct (or if off-diagonal blocks vanish appropriately).
- **Characteristic polynomial factorization**: Factor the characteristic polynomial completely. If all roots are distinct, the matrix is diagonalizable. If roots repeat, check geometric multiplicities (usually hard, so assume not diagonalizable unless told otherwise).

## Must-Memorize Formulas / Results
- **Diagonalization formula**: $A = PDP^{-1}$, where $P$ has eigenvectors as columns and $D$ has eigenvalues on the diagonal
- **Power formula**: $A^k = PD^kP^{-1}$ (for diagonal $D$, just raise each diagonal entry to the $k$-th power)
- **Diagonalizability condition**: Geometric multiplicity = algebraic multiplicity for each eigenvalue
- **Symmetric matrix theorem**: Symmetric real matrices are always diagonalizable with orthogonal eigenvectors
- **Distinct eigenvalues**: If all eigenvalues are distinct, the matrix is automatically diagonalizable
- **Trace and determinant**: $\\text{tr}(A) = \\text{tr}(D)$ and $\\det(A) = \\det(D)$ (invariant under diagonalization)
- **Invertibility**: $A$ is invertible iff no eigenvalue is zero (equivalently, $D$ is invertible)
