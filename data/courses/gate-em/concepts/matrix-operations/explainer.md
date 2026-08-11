# Matrix Operations

> GATE Engineering Mathematics | Linear Algebra | high frequency | difficulty: 0.2

## Intuition First
Matrices are like spreadsheets of numbers that encode how we transform or move objects in space. When you multiply two matrices, you're composing two transformations — like first rotating an object, then scaling it.

## Core Definition
**Matrix Operations**: Given matrices $A \in \mathbb{R}^{m \times n}$ and $B \in \mathbb{R}^{n \times p}$, the product $C = AB \in \mathbb{R}^{m \times p}$ is defined as:
$$C_{ij} = \sum_{k=1}^{n} A_{ik} B_{kj}$$

**Addition**: For matrices $A, B \in \mathbb{R}^{m \times n}$:
$$C = A + B \implies C_{ij} = A_{ij} + B_{ij}$$

**Scalar Multiplication**: For scalar $c$ and matrix $A$:
$$cA_{ij} = c \cdot A_{ij}$$

**Transpose**: $A^T_{ij} = A_{ji}$ (swap rows and columns).

## What Happens (Worked Example)

Label: "**What happens:**"

Consider $A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}$ and $B = \begin{pmatrix} 5 & 6 \\ 7 & 8 \end{pmatrix}$.

**Addition:** $A + B = \begin{pmatrix} 1+5 & 2+6 \\ 3+7 & 4+8 \end{pmatrix} = \begin{pmatrix} 6 & 8 \\ 10 & 12 \end{pmatrix}$

Geometrically: each vector in $A$ is shifted by the corresponding vector in $B$.

**Multiplication:** $AB = \begin{pmatrix} 1 \cdot 5 + 2 \cdot 7 & 1 \cdot 6 + 2 \cdot 8 \\ 3 \cdot 5 + 4 \cdot 7 & 3 \cdot 6 + 4 \cdot 8 \end{pmatrix} = \begin{pmatrix} 19 & 22 \\ 43 & 50 \end{pmatrix}$

**Transpose:** $A^T = \begin{pmatrix} 1 & 3 \\ 2 & 4 \end{pmatrix}$

Geometrically: the row vectors of $A$ become the column vectors of $A^T$.

Label: "**Why it works:**"

Matrix multiplication captures the composition of linear transformations. The element $C_{ij}$ is the dot product of row $i$ of $A$ with column $j$ of $B$, measuring how much the $i$-th output depends on all inputs through $B$. The transpose operation reflects a 90° rotation of the matrix's geometric structure.

## GATE MA Relevance
> **Why it matters in GATE MA:** Matrix operations are fundamental (5–8% of Linear Algebra questions). GATE tests rapid computation of 2×2 and 3×3 operations, properties like $(AB)^T = B^T A^T$, and identification of when multiplication is commutative (rarely). Most questions are MCQ with numerical answers.
