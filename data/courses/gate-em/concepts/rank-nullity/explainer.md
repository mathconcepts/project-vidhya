# Rank & Nullity

> GATE Engineering Mathematics | Linear Algebra | high frequency | difficulty: 0.5

## Intuition First
The rank of a matrix is the dimension of the space it "reaches"—how many independent directions the matrix spans. Nullity is the opposite: the dimension of the space it "collapses"—vectors that the matrix maps to zero. Together, they partition the input space: some directions are "reached" (rank), and the rest are "erased" (nullity).

## Core Definition
**Rank**: The rank of a matrix $A \in \mathbb{R}^{m \times n}$, denoted $\text{rank}(A)$, is the dimension of its column space (the span of its column vectors). Equivalently, it is the dimension of its row space, or the number of linearly independent rows/columns.

**Nullity**: The nullity of $A$, denoted $\text{nullity}(A)$ or $\text{null}(A)$, is the dimension of the null space—the set of all vectors $x$ such that $Ax = 0$.

**Rank-Nullity Theorem**: For an $m \times n$ matrix $A$:
$$\text{rank}(A) + \text{nullity}(A) = n$$

**Row Echelon Form**: To compute rank, reduce $A$ to row echelon form (REF). The rank equals the number of non-zero rows in the REF.

## What Happens (Worked Example)

Label: "**What happens:**"

Consider $A = \begin{pmatrix} 1 & 2 & 3 \\ 2 & 4 & 6 \\ 1 & 1 & 1 \end{pmatrix}$.

Reduce to row echelon form:
$$\begin{pmatrix} 1 & 2 & 3 \\ 2 & 4 & 6 \\ 1 & 1 & 1 \end{pmatrix} \xrightarrow{R_2 - 2R_1, R_3 - R_1} \begin{pmatrix} 1 & 2 & 3 \\ 0 & 0 & 0 \\ 0 & -1 & -2 \end{pmatrix} \xrightarrow{R_2 \leftrightarrow R_3} \begin{pmatrix} 1 & 2 & 3 \\ 0 & -1 & -2 \\ 0 & 0 & 0 \end{pmatrix}$$

The REF has 2 non-zero rows, so $\text{rank}(A) = 2$.

By rank-nullity: $\text{nullity}(A) = n - \text{rank}(A) = 3 - 2 = 1$ (one free variable).

To find the null space, solve $Ax = 0$. From the REF: $x_1 + 2x_2 + 3x_3 = 0$ and $-x_2 - 2x_3 = 0 \implies x_2 = -2x_3$. Then $x_1 = -2(-2x_3) - 3x_3 = 4x_3 - 3x_3 = x_3$. So $x = x_3(1, -2, 1)^T$. The null space is one-dimensional, confirming nullity = 1.

Geometrically: $A$ maps 3D space to a 2D subspace (rank = 2) and collapses one perpendicular dimension (nullity = 1).

Label: "**Why it works:**"

The rank-nullity theorem partitions the input space: the column space captures what $A$ "reaches," while the null space captures what $A$ "loses." Their dimensions sum to the total input dimension $n$ because every input vector is uniquely decomposed into a component in the null space (which $A$ kills) and a component in the orthogonal complement (which $A$ moves to the image).

## GATE MA Relevance
> **Why it matters in GATE MA:** Rank-nullity appears in 5–8% of Linear Algebra questions, often paired with system analysis. GATE tests: (1) computing rank via REF; (2) applying rank-nullity to find nullity; (3) determining consistency and solution counts for systems; (4) identifying rank deficiency. Most are MCQ with numerical answers.
