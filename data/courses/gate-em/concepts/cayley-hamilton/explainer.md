# Cayley-Hamilton Theorem

> GATE Engineering Mathematics | Linear Algebra | high frequency | difficulty: 0.5

## Intuition First
The Cayley-Hamilton theorem says: a matrix "satisfies" its own characteristic equation. If you write down the characteristic polynomial and replace the variable $\lambda$ with the matrix $A$, the result is zero. It's a surprising fact that connects the algebraic equation defining eigenvalues to the matrix itself.

## Core Definition
**Cayley-Hamilton Theorem**: For any square matrix $A \in \mathbb{R}^{n \times n}$, the characteristic polynomial $p(\lambda) = \det(\lambda I - A)$ satisfies:
$$p(A) = 0$$

Equivalently, if $p(\lambda) = \lambda^n + c_{n-1}\lambda^{n-1} + \cdots + c_1\lambda + c_0$, then:
$$A^n + c_{n-1}A^{n-1} + \cdots + c_1A + c_0I = 0$$

**Application: Matrix Powers**: From the characteristic equation, we can express $A^n$ as a linear combination of lower powers of $A$. This gives a way to compute high powers efficiently without diagonalization.

**Application: Inverse**: If $A$ is invertible, the Cayley-Hamilton equation can be rearranged to find $A^{-1}$ as a polynomial in $A$.

## What Happens (Worked Example)

Label: "**What happens:**"

Consider $A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$.

Characteristic polynomial:
$$p(\lambda) = \det(\lambda I - A) = \det\begin{pmatrix} \lambda - 2 & -1 \\ -1 & \lambda - 2 \end{pmatrix} = (\lambda - 2)^2 - 1 = \lambda^2 - 4\lambda + 3$$

By Cayley-Hamilton: $A^2 - 4A + 3I = 0$.

Verify:
$$A^2 = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}^2 = \begin{pmatrix} 5 & 4 \\ 4 & 5 \end{pmatrix}$$

$$A^2 - 4A + 3I = \begin{pmatrix} 5 & 4 \\ 4 & 5 \end{pmatrix} - 4\begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix} + 3\begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix}$$
$$= \begin{pmatrix} 5 & 4 \\ 4 & 5 \end{pmatrix} - \begin{pmatrix} 8 & 4 \\ 4 & 8 \end{pmatrix} + \begin{pmatrix} 3 & 0 \\ 0 & 3 \end{pmatrix} = \begin{pmatrix} 0 & 0 \\ 0 & 0 \end{pmatrix}$$ ✓

From $A^2 - 4A + 3I = 0$, we get $A^2 = 4A - 3I$. To compute $A^{10}$, repeatedly use this to reduce powers:
$$A^3 = A \cdot A^2 = A(4A - 3I) = 4A^2 - 3A = 4(4A - 3I) - 3A = 13A - 12I$$

And so on. This is much faster than computing powers directly for large exponents.

Geometrically: The Cayley-Hamilton relation constrains the matrix to lie on a specific algebraic variety—matrices satisfying this polynomial equation form a lower-dimensional subspace.

Label: "**Why it works:**"

The theorem follows from the fact that the characteristic polynomial is the monic polynomial whose roots are the eigenvalues. The matrix, being "determined" by its eigenvalues (via diagonalization), must satisfy any polynomial whose roots are its eigenvalues.

## GATE MA Relevance
> **Why it matters in GATE MA:** The Cayley-Hamilton theorem appears in 5–8% of Linear Algebra questions. GATE tests: (1) writing the characteristic polynomial and verifying the Cayley-Hamilton relation; (2) using it to reduce higher powers of $A$; (3) computing inverses; (4) finding minimal polynomials. Mostly MCQ; NAT questions ask for specific entries of computed powers.
