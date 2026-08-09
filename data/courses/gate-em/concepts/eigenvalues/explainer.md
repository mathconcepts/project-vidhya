# Eigenvalues & Eigenvectors

> GATE Engineering Mathematics | Linear Algebra | high frequency | difficulty: 0.5

## Intuition First
An eigenvector is a direction that a matrix "respects"—when you apply the matrix to an eigenvector, it just scales it, doesn't rotate it. The scale factor is the eigenvalue. These special vectors and scalars are the skeleton of what a matrix does to space.

## Core Definition
**Eigenvalue & Eigenvector**: For a square matrix $A \in \mathbb{R}^{n \times n}$, a non-zero vector $\mathbf{v} \in \mathbb{R}^n$ and scalar $\lambda \in \mathbb{R}$ (or $\mathbb{C}$) satisfy:
$$A\mathbf{v} = \lambda \mathbf{v}$$

Then $\lambda$ is an **eigenvalue** and $\mathbf{v}$ is the corresponding **eigenvector**.

**Characteristic Polynomial**: The eigenvalues are roots of the characteristic polynomial:
$$\det(A - \lambda I) = 0$$

**Algebraic Multiplicity**: The multiplicity of $\lambda$ as a root of $\det(A - \lambda I) = 0$.

**Geometric Multiplicity**: The dimension of the eigenspace $\text{null}(A - \lambda I)$.

## What Happens (Worked Example)

Label: "**What happens:**"

Let $A = \begin{pmatrix} 2 & 1 \\ 0 & 3 \end{pmatrix}$.

Find eigenvalues: Solve $\det(A - \lambda I) = 0$:
$$\det\begin{pmatrix} 2 - \lambda & 1 \\ 0 & 3 - \lambda \end{pmatrix} = (2 - \lambda)(3 - \lambda) - 0 = 0$$

So $(2 - \lambda)(3 - \lambda) = 0 \implies \lambda = 2$ or $\lambda = 3$.

For $\lambda = 2$, solve $(A - 2I)\mathbf{v} = \mathbf{0}$:
$$\begin{pmatrix} 0 & 1 \\ 0 & 1 \end{pmatrix}\begin{pmatrix} v_1 \\ v_2 \end{pmatrix} = \mathbf{0} \implies v_2 = 0$$

Eigenvector: $\mathbf{v} = (1, 0)$ (or any non-zero scalar multiple).

For $\lambda = 3$, solve $(A - 3I)\mathbf{v} = \mathbf{0}$:
$$\begin{pmatrix} -1 & 1 \\ 0 & 0 \end{pmatrix}\begin{pmatrix} v_1 \\ v_2 \end{pmatrix} = \mathbf{0} \implies v_1 = v_2$$

Eigenvector: $\mathbf{v} = (1, 1)$ (or any non-zero scalar multiple).

Verify: $A(1, 0) = (2, 0) = 2(1, 0)$ ✓ and $A(1, 1) = (3, 3) = 3(1, 1)$ ✓

Geometrically: $(1, 0)$ is stretched by factor 2, while $(1, 1)$ is stretched by factor 3.

Label: "**Why it works:**"

Eigenvectors are the "natural directions" of a transformation. By choosing basis vectors that are eigenvectors, the transformation becomes diagonal—easy to understand and compute. The eigenvalue tells you how much that direction is scaled.

## GATE MA Relevance
> **Why it matters in GATE MA:** Eigenvalues and eigenvectors appear in 8–12% of Linear Algebra questions. GATE tests: (1) computing eigenvalues via the characteristic polynomial; (2) finding eigenvectors; (3) properties like trace and determinant being sums/products of eigenvalues; (4) diagonalization and Cayley-Hamilton applications. Mix of MCQ and NAT.
