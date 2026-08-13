---
id: diagonalization-intuition
concept_id: diagonalization
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# What Is Diagonalization?

A matrix $A$ is **diagonalizable** when it can be written as:

$$A = PDP^{-1}$$

where $D$ is a diagonal matrix (eigenvalues on the diagonal) and $P$ is the matrix whose columns are the corresponding eigenvectors.

## The Core Idea

Think of diagonalization as **finding a better coordinate system** for the transformation. In standard coordinates, $A$ mixes everything together. In the eigenvector basis, the transformation simply **scales** each axis independently — no mixing at all.

## What Goes on the Diagonal?

$$D = \begin{pmatrix} \lambda_1 & 0 & \cdots & 0 \\ 0 & \lambda_2 & \cdots & 0 \\ \vdots & & \ddots & \vdots \\ 0 & 0 & \cdots & \lambda_n \end{pmatrix}, \qquad P = \begin{pmatrix} \mathbf{v}_1 & \mathbf{v}_2 & \cdots & \mathbf{v}_n \end{pmatrix}$$

The eigenvalues $\lambda_i$ go on the diagonal of $D$; the eigenvectors $\mathbf{v}_i$ form the columns of $P$.

## When Can You Diagonalize?

An $n \times n$ matrix $A$ is diagonalizable **if and only if** it has $n$ linearly independent eigenvectors.

Sufficient conditions (either one is enough):

- $A$ has $n$ **distinct** eigenvalues.
- $A$ is **real symmetric** ($A = A^T$) — always diagonalizable, with orthogonal $P$.

## Why Bother?

**Powers become trivial.** Since $D$ is diagonal:

$$A^k = PD^kP^{-1}, \qquad D^k = \begin{pmatrix} \lambda_1^k & & \\ & \ddots & \\ & & \lambda_n^k \end{pmatrix}$$

Computing $A^{100}$ requires just cubing $n$ numbers, not multiplying a matrix 100 times.

## Quick Recognition at GATE

| Situation | Diagonalizable? |
|---|---|
| $n$ distinct eigenvalues | Always yes |
| Real symmetric matrix | Always yes |
| Eigenvalue with geometric multiplicity $<$ algebraic multiplicity | No |
| Identity matrix | Yes (already diagonal, $P = I$) |

**Geometric multiplicity** = dimension of eigenspace = number of free variables when solving $(A - \lambda I)\mathbf{x} = \mathbf{0}$.  
**Algebraic multiplicity** = power of $(\lambda - \lambda_i)$ in the characteristic polynomial.

Diagonalizable requires: geometric multiplicity = algebraic multiplicity **for every** eigenvalue.
