# Teaching Tips: Cayley-Hamilton Theorem

## Common Student Errors
- **Sign mistakes in the characteristic polynomial**: Students often write $\det(A - \lambda I)$ instead of $\det(\lambda I - A)$. Both have the same roots, but the signs of coefficients differ. Be consistent.
- **Forgetting to substitute the matrix for $\lambda$**: When substituting $A$ into the characteristic polynomial, replace $\lambda$ with $A$ and scalars with scalar multiples of $I$. Students sometimes forget the identity matrices.
- **Confusing the relation**: Cayley-Hamilton says $p(A) = 0$ where $p$ is the characteristic polynomial. It doesn't say $\det(A - \lambda I) = 0$ when you substitute $A$—that's circular and nonsensical.

## GATE Question Pattern
GATE Cayley-Hamilton questions test: (1) computing the characteristic polynomial correctly; (2) verifying the Cayley-Hamilton relation by direct substitution; (3) using it to express high powers of $A$ as linear combinations of lower powers; (4) finding matrix inverses via rearrangement; (5) applications to determining minimal polynomials. Most are MCQ; NAT questions ask for specific matrix entries after reduction.

## Speed Tricks for MCQs
- **Diagonal matrix shortcut**: For diagonal matrices, the characteristic polynomial is $(λ - d_1)(λ - d_2) \cdots (λ - d_n)$ where $d_i$ are diagonal entries. The Cayley-Hamilton relation is then $(A - d_1 I)(A - d_2 I) \cdots (A - d_n I) = 0$.
- **Use Cayley-Hamilton to reduce powers**: If asked to compute $A^k$ for large $k$, use the characteristic equation to express $A^n$ (or $A^{n+1}$, etc.) as a polynomial of degree $< n$, then keep reducing recursively.
- **Trace and determinant check**: The coefficients of the characteristic polynomial are related to trace and determinant. For a $2 \times 2$ matrix, $p(\lambda) = \lambda^2 - \text{tr}(A) \lambda + \det(A)$. Spot-check this to verify your characteristic polynomial.

## Must-Memorize Formulas / Results
- **Cayley-Hamilton theorem**: $p(A) = 0$ where $p(\lambda) = \\det(\\lambda I - A)$
- **2×2 characteristic polynomial**: $p(\\lambda) = \\lambda^2 - \\text{tr}(A)\\lambda + \\det(A)$
- **Cayley-Hamilton for 2×2**: $A^2 - \\text{tr}(A) A + \\det(A) I = 0$
- **3×3 characteristic polynomial form**: $p(\\lambda) = \\lambda^3 - \\text{tr}(A)\\lambda^2 + c_1\\lambda - \\det(A)$ for some $c_1$
- **Power reduction**: Use Cayley-Hamilton to express $A^n$ as $\\alpha_0 I + \\alpha_1 A + \\cdots + \\alpha_{n-1} A^{n-1}$
- **Inverse formula**: Rearrange $p(A) = 0$ to isolate $I$ and solve for $A^{-1}$ if $\\det(A) \\neq 0$
- **Minimal polynomial**: The minimal polynomial divides the characteristic polynomial and satisfies $m(A) = 0$ with minimal degree
