# Eigenvalues and eigenvectors

## Intuition

When a square matrix $A$ acts on a vector, most vectors get rotated, stretched, or otherwise transformed in complicated ways. But **some special vectors** are merely scaled — their direction stays the same, and only their magnitude changes. These special vectors are called **eigenvectors**, and the scaling factors are called **eigenvalues**.

Geometrically: if you think of $A$ as a transformation of the plane, an eigenvector is a vector whose line through the origin maps to itself. The eigenvalue tells you by how much the vector stretches (or shrinks, or flips) along that line.

## Formal definition

A nonzero vector $\mathbf{v}$ is an **eigenvector** of a square matrix $A$ if there exists a scalar $\lambda$ such that:

$$
A\mathbf{v} = \lambda \mathbf{v}
$$

The scalar $\lambda$ is the **eigenvalue** corresponding to $\mathbf{v}$.

## How to find them

Rearranging $A\mathbf{v} = \lambda\mathbf{v}$:

$$
A\mathbf{v} - \lambda\mathbf{v} = \mathbf{0}
$$

$$
(A - \lambda I)\mathbf{v} = \mathbf{0}
$$

For this to have a nonzero solution $\mathbf{v}$, the matrix $A - \lambda I$ must be singular, which means its determinant must be zero:

$$
\det(A - \lambda I) = 0
$$

This is the **characteristic equation**. Solving it gives the eigenvalues. For each eigenvalue $\lambda_i$, plug back into $(A - \lambda_i I)\mathbf{v} = \mathbf{0}$ and solve for $\mathbf{v}$ to get the corresponding eigenvectors.

## Properties worth memorizing

For an $n \times n$ matrix $A$ with eigenvalues $\lambda_1, \lambda_2, \ldots, \lambda_n$ (counted with multiplicity):

- $\det(A) = \lambda_1 \lambda_2 \cdots \lambda_n$ — the determinant equals the product of eigenvalues
- $\text{tr}(A) = \lambda_1 + \lambda_2 + \cdots + \lambda_n$ — the trace equals the sum of eigenvalues
- $A$ is invertible $\iff$ all eigenvalues are nonzero
- Eigenvalues of $A^k$ are $\lambda_1^k, \ldots, \lambda_n^k$

## Why this matters for your exam

**BITSAT / JEE Main**: Eigenvalues appear indirectly — questions often ask about trace, determinant, or powers of matrices where recognizing the eigenvalue structure gives you a shortcut. Direct eigenvalue computation is rarer but appears.

**UGEE**: Much more direct. UGEE is run by IIITH (a CS-oriented institute), and linear algebra with explicit eigenvalue questions is common. Expect at least one eigenvalue problem per paper.

## Common mistakes

1. **Forgetting eigenvectors are nonzero by definition.** The zero vector is *always* mapped to the zero vector, so it would technically satisfy $A\mathbf{v} = \lambda\mathbf{v}$ for any $\lambda$. The definition explicitly excludes $\mathbf{v} = \mathbf{0}$.
2. **Sign errors in the characteristic equation.** Students often write $\det(A) - \lambda I$ when they mean $\det(A - \lambda I)$. These are very different quantities.
3. **Normalizing eigenvectors.** Any nonzero scalar multiple of an eigenvector is also an eigenvector with the same eigenvalue. Exam questions sometimes ask for the "unit eigenvector" — remember to divide by the magnitude.

See [`worked-example.md`](./worked-example.md) for a full computation.
