# Diagonalization

> GATE Engineering Mathematics | Linear Algebra | high frequency | difficulty: 0.6

## Intuition First
Diagonalization is "simplifying" a matrix by rotating the coordinate system so the matrix becomes diagonal. In the new coordinates, the matrix just scales along each axis—no mixing. It's like finding a new "natural" basis where the transformation is easiest to understand.

## Core Definition
**Diagonalization**: A matrix $A \in \mathbb{R}^{n \times n}$ is **diagonalizable** if there exist a matrix $P$ with linearly independent columns and a diagonal matrix $D$ such that:
$$A = PDP^{-1}$$

The columns of $P$ are eigenvectors of $A$, and the diagonal entries of $D$ are the corresponding eigenvalues.

**Diagonalization Condition**: $A$ is diagonalizable if and only if $A$ has $n$ linearly independent eigenvectors (geometric multiplicity = algebraic multiplicity for each eigenvalue).

**Power Formula**: If $A = PDP^{-1}$, then:
$$A^k = PD^kP^{-1}$$

For diagonal $D$, $D^k$ is just the diagonal entries raised to the $k$-th power.

## What Happens (Worked Example)

Label: "**What happens:**"

Consider $A = \begin{pmatrix} 4 & 1 \\ 1 & 2 \end{pmatrix}$ (symmetric, hence diagonalizable).

Eigenvalues: $\det(A - \lambda I) = (4 - \lambda)(2 - \lambda) - 1 = \lambda^2 - 6\lambda + 7 = 0$. Using the quadratic formula: $\lambda = \frac{6 \pm \sqrt{36 - 28}}{2} = \frac{6 \pm 2\sqrt{2}}{2} = 3 \pm \sqrt{2}$.

Eigenvectors: (for $\lambda_1 = 3 + \sqrt{2}$ and $\lambda_2 = 3 - \sqrt{2}$, compute via $(A - \lambda I)\mathbf{v} = \mathbf{0}$).

Let $\mathbf{v}_1$ and $\mathbf{v}_2$ be the normalized eigenvectors (orthonormal for symmetric matrices). Then:
$$P = \begin{pmatrix} | & | \\ \mathbf{v}_1 & \mathbf{v}_2 \\ | & | \end{pmatrix}, \quad D = \begin{pmatrix} 3 + \sqrt{2} & 0 \\ 0 & 3 - \sqrt{2} \end{pmatrix}$$

$$A = PDP^{-1}$$

Now, $A^{10} = PD^{10}P^{-1}$, where $D^{10} = \begin{pmatrix} (3 + \sqrt{2})^{10} & 0 \\ 0 & (3 - \sqrt{2})^{10} \end{pmatrix}$ is easy to compute.

Geometrically: In the eigenvector coordinate system, $A$ stretches by $3 + \sqrt{2}$ along one axis and $3 - \sqrt{2}$ along another—no rotation, just scaling.

Label: "**Why it works:**"

Diagonalization works because eigenvectors form a basis (when $A$ has enough independent ones) in which the matrix acts as simple scaling. High powers and exponentials become easy to compute using the diagonal form.

## GATE MA Relevance
> **Why it matters in GATE MA:** Diagonalization appears in 6–10% of Linear Algebra questions, especially paired with Cayley-Hamilton and applications. GATE tests: (1) determining if a matrix is diagonalizable; (2) finding $P$ and $D$; (3) computing $A^k$ using diagonalization; (4) recognizing when symmetric matrices are guaranteed to be diagonalizable. Mostly MCQ; NAT questions ask for specific matrix entries.
