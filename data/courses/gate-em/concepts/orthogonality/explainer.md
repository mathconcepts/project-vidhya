# Orthogonality

> GATE Engineering Mathematics | Linear Algebra | medium frequency | difficulty: 0.6

## Intuition First
Two vectors are orthogonal if they're perpendicular—their dot product is zero. Orthogonal vectors point in completely "unrelated" directions, giving no component of one along the other. Orthogonal bases are special: they make computations simpler because you don't need to solve messy systems—just dot products.

## Core Definition
**Orthogonal Vectors**: Vectors $\mathbf{u}, \mathbf{v} \in \mathbb{R}^n$ are orthogonal if:
$$\mathbf{u} \cdot \mathbf{v} = 0$$

**Orthogonal Set**: A set $\{\mathbf{v}_1, \ldots, \mathbf{v}_k\}$ is orthogonal if every pair is orthogonal: $\mathbf{v}_i \cdot \mathbf{v}_j = 0$ for $i \neq j$.

**Orthonormal Set**: A set is orthonormal if it's orthogonal and every vector is unit (normalized): $\|\mathbf{v}_i\| = 1$.

**Orthogonal Matrix**: A square matrix $Q$ is orthogonal if:
$$Q^T Q = QQ^T = I$$

Equivalently, $Q^{-1} = Q^T$. Columns of $Q$ form an orthonormal set.

**Orthogonal Subspaces**: Subspaces $U$ and $V$ of $\mathbb{R}^n$ are orthogonal if every vector in $U$ is orthogonal to every vector in $V$.

**Orthogonal Complement**: For subspace $W$, its orthogonal complement $W^\perp = \{\mathbf{v} : \mathbf{v} \cdot \mathbf{w} = 0 \text{ for all } \mathbf{w} \in W\}$.

## What Happens (Worked Example)

Label: "**What happens:**"

Consider $\mathbf{u} = (1, 0, 1)$ and $\mathbf{v} = (1, 2, -1)$.

Check orthogonality: $\mathbf{u} \cdot \mathbf{v} = 1(1) + 0(2) + 1(-1) = 1 + 0 - 1 = 0$. ✓ Orthogonal.

To create an orthonormal basis from $\{\mathbf{u}, \mathbf{v}, (0, 1, 0)\}$ (three independent vectors), use Gram-Schmidt:

1. Normalize $\mathbf{u}$: $\|\mathbf{u}\| = \sqrt{1 + 0 + 1} = \sqrt{2}$. So $\mathbf{e}_1 = \frac{1}{\sqrt{2}}(1, 0, 1)$.

2. Orthogonalize $\mathbf{v}$: $\mathbf{v}' = \mathbf{v} - (\mathbf{v} \cdot \mathbf{e}_1)\mathbf{e}_1 = (1, 2, -1) - 0 \cdot \mathbf{e}_1 = (1, 2, -1)$ (already orthogonal to $\mathbf{e}_1$).

3. Normalize $\mathbf{v}'$: $\|\mathbf{v}'\| = \sqrt{1 + 4 + 1} = \sqrt{6}$. So $\mathbf{e}_2 = \frac{1}{\sqrt{6}}(1, 2, -1)$.

4. Orthogonalize $(0, 1, 0)$: remove components along $\mathbf{e}_1$ and $\mathbf{e}_2$, then normalize.

The result is an orthonormal basis $\{\mathbf{e}_1, \mathbf{e}_2, \mathbf{e}_3\}$.

Geometrically: Orthonormal vectors are like the unit coordinate axes in a rotated frame—they point in perpendicular directions with unit length.

Label: "**Why it works:**"

Orthogonal vectors decouple—changes along one direction don't affect projections onto others. This simplicity underlies QR decomposition, least-squares fitting, and spectral analysis.

## GATE MA Relevance
> **Why it matters in GATE MA:** Orthogonality appears in 6–10% of Linear Algebra questions. GATE tests: (1) checking orthogonality of vectors; (2) Gram-Schmidt orthogonalization; (3) properties of orthogonal matrices (determinant = ±1, preserving lengths); (4) orthogonal complements and projections; (5) applications to symmetric matrix diagonalization (eigenvectors are orthogonal). Mix of MCQ and NAT.
