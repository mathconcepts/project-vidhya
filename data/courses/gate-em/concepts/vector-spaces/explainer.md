# Vector Spaces

> GATE Engineering Mathematics | Linear Algebra | medium frequency | difficulty: 0.5

## Intuition First
A vector space is a playground where you can add vectors and scale them, and the results stay in the playground. Think of it as a geometric setting where the usual rules of vector arithmetic hold—no surprises, no escapes.

## Core Definition
**Vector Space**: A set $V$ over a field $\mathbb{F}$ (usually $\mathbb{R}$ or $\mathbb{C}$) is a vector space if it satisfies:
1. **Closure under addition**: $u, v \in V \implies u + v \in V$
2. **Closure under scalar multiplication**: $c \in \mathbb{F}, v \in V \implies cv \in V$
3. **Associativity** and **commutativity** of addition
4. **Additive identity** ($\mathbf{0}$ exists in $V$)
5. **Additive inverses** exist for all $v \in V$
6. **Associativity** and **distributivity** of scalar multiplication
7. **Multiplicative identity** ($1v = v$)

**Subspace**: $W \subseteq V$ is a subspace if: $\mathbf{0} \in W$, and for all $u, v \in W$ and $c \in \mathbb{F}$: $u + v \in W$ and $cv \in W$.

**Basis**: A set $\{\mathbf{v}_1, \ldots, \mathbf{v}_n\} \subseteq V$ is a basis if every $v \in V$ is uniquely expressible as $v = c_1\mathbf{v}_1 + \cdots + c_n\mathbf{v}_n$.

**Dimension**: The dimension of $V$, denoted $\dim(V)$, is the number of vectors in any basis.

## What Happens (Worked Example)

Label: "**What happens:**"

Consider $V = \mathbb{R}^3$. The standard basis is $\{(1, 0, 0), (0, 1, 0), (0, 0, 1)\}$. Every vector $(x, y, z)$ is a unique linear combination: $(x, y, z) = x(1, 0, 0) + y(0, 1, 0) + z(0, 0, 1)$. So $\dim(\mathbb{R}^3) = 3$.

Consider the subspace $W = \{(x, y, z) : x + y + z = 0\}$ (a plane through the origin). A basis for $W$ is $\{(1, -1, 0), (1, 0, -1)\}$ (any two independent vectors in the plane). So $\dim(W) = 2$.

Geometrically: $W$ is the plane perpendicular to the vector $(1, 1, 1)$ in $\mathbb{R}^3$.

Label: "**Why it works:**"

A basis captures the "directions" of a space. The dimension tells you how many free choices you have—every element of the space is determined by its coordinates relative to the basis. Subspaces inherit this structure but are lower-dimensional because they satisfy additional constraints (like lying in a plane).

## GATE MA Relevance
> **Why it matters in GATE MA:** Vector spaces and subspaces appear in 5–7% of Linear Algebra questions. GATE tests: (1) verifying subspace conditions; (2) finding bases and dimensions; (3) span and linear dependence/independence; (4) applications to solution spaces of homogeneous systems. Mostly MCQ.
