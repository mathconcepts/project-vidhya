# Teaching Tips: Numerical Linear Algebra

## Common Student Errors

- **LU multiplier sign flip**: When forming the multiplier $m = a_{j1} / a_{11}$, the sign goes into the $L$ matrix as-is, NOT negated. A question asks "find $L$ such that $A = LU$"; many students write $L$ with flipped signs, getting the wrong result. Double-check: $L_{i,1} = m_{i,1}$ exactly, not $-m$.
- **Forgetting to update both sides**: In Gaussian elimination on an augmented matrix $[A | b]$, the right-hand side $b$ must be updated in lockstep with $A$. A student might correctly eliminate the left side but forget to subtract from $b$, leading to the wrong solution.
- **Matrix norm confusion**: There are many norms: $L_1$ (max column sum), $L_\infty$ (max row sum), $L_2$ (largest singular value), Frobenius. A question says "compute the matrix norm"; students may compute the wrong one. Read carefully: if it says $\|A\|_2$, that's the spectral norm; if it gives a formula like $\sqrt{\sum a_{ij}^2}$, that's Frobenius.

## GATE Question Pattern

Numerical linear algebra questions in GATE come in flavors: (1) **Gaussian elimination**: "Eliminate to triangular form and back-substitute." These are arithmetic drills. (2) **LU factorization**: "Factor into $LU$"; checking your work by verifying $LU = A$ is quick and recommended. (3) **Iterative methods**: "Perform one Jacobi or Gauss-Seidel iteration"; start from initial guess, apply formula, report the new vector. (4) **Matrix norms/conditioning**: "Compute the Frobenius norm or condition number." These are less common but straightforward once you know the formula.

## Speed Tricks for MCQs

- **LU factorization shortcut**: The $L$ matrix's entries below the diagonal are **exactly the multipliers** used during elimination. No need to recompute; just copy them in. Upper matrix $U$ is what's left after elimination.
- **Diagonal matrix check**: If $A$ is diagonal, LU factorization is trivial: $L = I$, $U = A$. A question might disguise this as "factor" then expect you to recognize the pattern instantly.
- **Norm comparison**: For small matrices, Frobenius norm is often the fastest to compute (just sum squares). The spectral norm ($L_2$) requires singular values (slower). If a question offers both, Frobenius is usually the intended choice for a 1-mark question.
- **Gauss-Seidel vs. Jacobi convergence**: Gauss-Seidel typically converges 2–3× faster than Jacobi (because it uses updated values). If a question asks "which converges faster?", the answer is Gauss-Seidel, assuming the matrix is symmetric positive definite or strictly diagonally dominant.

## Must-Memorize Formulas / Results

- **Gaussian elimination multiplier**: $m_{ij} = \\frac{a_{ij}^{(i-1)}}{a_{ii}^{(i-1)}}$ (element to eliminate divided by pivot)
- **LU decomposition**: $A = LU$ where $L$ is lower triangular (1s on diagonal) and $U$ is upper triangular. The multipliers from elimination go directly into $L$.
- **Frobenius norm**: $\\|A\\|_F = \\sqrt{\\sum_{i,j} a_{ij}^2}$ (Euclidean norm of entries)
- **Spectral norm (L2)**: $\\|A\\|_2 = \\sqrt{\\lambda_{\\max}(A^T A)}$ (largest singular value)
- **Condition number**: $\\kappa(A) = \\|A\\| \\cdot \\|A^{-1}\\|$ (measures sensitivity to perturbation; $\\kappa(A) ≥ 1$ always)
- **Jacobi iteration**: $x_i^{(k+1)} = \\frac{1}{a_{ii}}\\left(b_i - \\sum_{j ≠ i} a_{ij} x_j^{(k)}\\right)$ (uses old values only)
- **Gauss-Seidel iteration**: $x_i^{(k+1)} = \\frac{1}{a_{ii}}\\left(b_i - \\sum_{j < i} a_{ij} x_j^{(k+1)} - \\sum_{j > i} a_{ij} x_j^{(k)}\\right)$ (uses updated values when available)
- **Convergence condition** (for Jacobi/Gauss-Seidel): Matrix $A$ must be strictly diagonally dominant: $|a_{ii}| > \\sum_{j ≠ i} |a_{ij}|$ for each $i$.
