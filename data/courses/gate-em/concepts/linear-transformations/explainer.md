# Linear Transformations

> GATE Engineering Mathematics | Linear Algebra | medium frequency | difficulty: 0.6

## Intuition First
A linear transformation is a "fair" way to move vectors in space: it respects vector addition and scalar multiplication. Rotating an image, scaling it, or shearing it are linear transformations. Translating (moving without rotating) is not linear because it doesn't map zero to zero.

## Core Definition
**Linear Transformation**: A function $T: V \to W$ (between vector spaces $V$ and $W$) is linear if:
1. $T(\mathbf{u} + \mathbf{v}) = T(\mathbf{u}) + T(\mathbf{v})$ for all $\mathbf{u}, \mathbf{v} \in V$
2. $T(c\mathbf{v}) = cT(\mathbf{v})$ for all $c \in \mathbb{F}$ and $\mathbf{v} \in V$

**Matrix Representation**: Every linear transformation $T: \mathbb{R}^n \to \mathbb{R}^m$ can be represented by an $m \times n$ matrix $A$ such that $T(\mathbf{x}) = A\mathbf{x}$.

**Kernel (Null Space)**: $\ker(T) = \{\mathbf{v} \in V : T(\mathbf{v}) = \mathbf{0}\}$
**Image (Range)**: $\text{Im}(T) = \{T(\mathbf{v}) : \mathbf{v} \in V\}$

**Rank-Nullity for Transformations**: $\dim(\text{Im}(T)) + \dim(\ker(T)) = \dim(V)$

## What Happens (Worked Example)

Label: "**What happens:**"

Consider $T: \mathbb{R}^2 \to \mathbb{R}^2$ defined by $T(x, y) = (2x + y, x)$. The matrix is:
$$A = \begin{pmatrix} 2 & 1 \\ 1 & 0 \end{pmatrix}$$

Apply $T$ to $(1, 0)$: $T(1, 0) = (2, 1)$ (first column of $A$).
Apply $T$ to $(0, 1)$: $T(0, 1) = (1, 0)$ (second column of $A$).

Find the kernel: Solve $A\mathbf{x} = \mathbf{0}$:
$$\begin{pmatrix} 2 & 1 \\ 1 & 0 \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \end{pmatrix} \implies 2x + y = 0, x = 0 \implies x = y = 0$$

So $\ker(T) = \{\mathbf{0}\}$ and $\dim(\ker(T)) = 0$. Therefore, $\dim(\text{Im}(T)) = 2 - 0 = 2$ (the image is all of $\mathbb{R}^2$).

Geometrically: $T$ stretches and shears the plane, mapping it to itself with no collapsing.

Label: "**Why it works:**"

The matrix $A$ encodes how $T$ transforms basis vectors. Columns of $A$ are images of the standard basis. The kernel captures what $T$ loses; the image captures what it reaches. Together, via rank-nullity, they partition the input space's dimensionality.

## GATE MA Relevance
> **Why it matters in GATE MA:** Linear transformations appear in 5–8% of Linear Algebra questions. GATE tests: (1) finding matrix representations; (2) computing kernel and image; (3) verifying linearity; (4) composing transformations; (5) relating to eigenvalues and diagonalization. Mostly MCQ.
