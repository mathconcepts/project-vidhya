# Teaching Tips: Eigenvalues & Eigenvectors

## Common Student Errors
- **Forgetting the determinant formula**: Students compute the characteristic polynomial incorrectly. Always expand $\det(A - \lambda I)$, not $\det(\lambda I - A)$ (though the roots are the same—just signs differ).
- **Confusing trace and determinant**: Trace = sum of eigenvalues; Determinant = product of eigenvalues. Students often reverse these.
- **Not recognizing diagonal/triangular matrices**: For diagonal or triangular matrices, eigenvalues are the diagonal entries immediately—no computation needed.

## GATE Question Pattern
GATE eigenvalue questions test: (1) computing eigenvalues via the characteristic polynomial (2×2 and 3×3 mostly); (2) finding eigenvectors; (3) recognizing trace and determinant as sums/products of eigenvalues; (4) geometric and algebraic multiplicities; (5) applications in diagonalization and Cayley-Hamilton. Most are MCQ; NAT questions ask for specific eigenvalues or eigenvector components.

## Speed Tricks for MCQs
- **Diagonal and triangular matrices**: Eigenvalues are diagonal entries directly—no computation.
- **Sum and product tricks**: If $\lambda_1 + \lambda_2 = \text{tr}(A)$ and $\lambda_1 \lambda_2 = \det(A)$, use these to factor the characteristic polynomial quickly for 2×2 matrices.
- **Zero eigenvalue check**: If $\det(A) = 0$, then 0 is an eigenvalue. If trace = 0 and $\det \neq 0$, the eigenvalues sum to zero.

## Must-Memorize Formulas / Results
- **Eigenvalue equation**: $A\\mathbf{v} = \\lambda \\mathbf{v}$
- **Characteristic polynomial**: $\\det(A - \\lambda I) = 0$
- **Trace property**: $\\text{tr}(A) = \\sum \\lambda_i$ (sum of eigenvalues)
- **Determinant property**: $\\det(A) = \\prod \\lambda_i$ (product of eigenvalues)
- **Eigenspace**: $E_\\lambda = \\text{null}(A - \\lambda I)$ (all eigenvectors for eigenvalue $\\lambda$)
- **Algebraic multiplicity**: Multiplicity of $\\lambda$ in the characteristic polynomial
- **Geometric multiplicity**: $\\dim(\\text{null}(A - \\lambda I))$
- **Multiplicity bound**: Geometric multiplicity $\\leq$ Algebraic multiplicity
- **Similarity invariance**: Eigenvalues are invariant under similarity transformations ($A$ and $P^{-1}AP$ have the same eigenvalues)
