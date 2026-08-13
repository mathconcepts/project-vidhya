---
id: numerical-linear-algebra-intuition
concept_id: numerical-linear-algebra
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Numerical Linear Algebra

Solving $Ax = b$ and finding eigenvalues numerically — the two core tasks that underlie almost every computational simulation.

---

## Gaussian Elimination with Partial Pivoting

**Idea:** Transform $Ax = b$ into an upper-triangular system $Ux = c$ by row operations, then back-substitute.

**Partial pivoting:** At each elimination step, swap the current row with the row below it that has the **largest absolute value** in the pivot column. This prevents division by near-zero numbers (which amplify floating-point errors).

**Complexity:** $O(n^3)$ operations for an $n\times n$ system.

**Key fact for GATE:** Gaussian elimination without pivoting is numerically unstable; partial pivoting makes it stable for almost all practical matrices.

---

## LU Decomposition

Factorize $A = LU$ where:
- $L$ is **lower triangular** with 1s on the diagonal (stores the elimination multipliers)
- $U$ is **upper triangular** (the result of elimination)

To solve $Ax = b$:
1. **Forward substitution:** Solve $Ly = b$ for $y$ — $O(n^2)$
2. **Back substitution:** Solve $Ux = y$ for $x$ — $O(n^2)$

**Advantage:** Once $A = LU$ is computed ($O(n^3)$), any new right-hand side $b$ can be solved in $O(n^2)$. Ideal when the same $A$ is used with many different $b$ vectors.

---

## Iterative Methods: Jacobi and Gauss-Seidel

For large sparse systems, direct methods are expensive. Iterative methods start from a guess and refine it.

**Jacobi:** Update all components of $x$ simultaneously using old values.

$$x_i^{(k+1)} = \frac{1}{a_{ii}}\left(b_i - \sum_{j \neq i} a_{ij}\,x_j^{(k)}\right)$$

**Gauss-Seidel:** Use the newest available values within the same iteration — faster convergence in practice.

$$x_i^{(k+1)} = \frac{1}{a_{ii}}\left(b_i - \sum_{j < i} a_{ij}\,x_j^{(k+1)} - \sum_{j > i} a_{ij}\,x_j^{(k)}\right)$$

**Convergence condition:** Both methods converge if $A$ is *strictly diagonally dominant*:

$$|a_{ii}| > \sum_{j \neq i} |a_{ij}| \quad \text{for all } i$$

Gauss-Seidel typically converges in about half as many iterations as Jacobi.

---

## Condition Number

The **condition number** $\kappa(A) = \|A\|\cdot\|A^{-1}\|$ measures how sensitive the solution $x$ is to perturbations in $b$ or $A$.

$$\frac{\|\delta x\|}{\|x\|} \leq \kappa(A)\,\frac{\|\delta b\|}{\|b\|}$$

| $\kappa(A)$ | Interpretation |
|---|---|
| $\approx 1$ | Well-conditioned; small errors in $b$ → small errors in $x$ |
| $\gg 1$ | Ill-conditioned; tiny perturbations can cause large changes in $x$ |
| $= 1$ | Perfectly conditioned (orthogonal matrices) |

**GATE fact:** A singular matrix has $\kappa(A) = \infty$. If $\kappa(A) \approx 10^k$, expect roughly $k$ digits of accuracy to be lost in finite-precision arithmetic.

---

## Power Method for Dominant Eigenvalue

Finds the eigenvalue of **largest magnitude** ($\lambda_1$) and its eigenvector.

**Algorithm:** Start with a non-zero vector $v_0$. Iterate:

$$v_{k+1} = \frac{Av_k}{\|Av_k\|}$$

The Rayleigh quotient $\lambda \approx v_k^T A v_k / v_k^T v_k$ converges to $\lambda_1$.

**Convergence rate:** Proportional to $|\lambda_2/\lambda_1|$, where $\lambda_2$ is the second-largest eigenvalue in magnitude. Convergence is fast when the dominant eigenvalue is well-separated.

---

## Method Comparison (GATE Quick Reference)

| Method | Cost | Use case |
|---|---|---|
| Gaussian elimination | $O(n^3)$ | Dense systems, one-shot |
| LU decomposition | $O(n^3)$ setup + $O(n^2)$ per solve | Multiple RHS vectors |
| Jacobi | $O(n^2)$ per iter | Sparse, diagonally dominant |
| Gauss-Seidel | $O(n^2)$ per iter | Faster than Jacobi |
| Power method | $O(n^2)$ per iter | Dominant eigenvalue only |
