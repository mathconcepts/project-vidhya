---
id: change-of-basis.formal-definition
concept_id: change-of-basis
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

# Formal Definition: Change of Basis

## Definition

Let $B = \{v_1, v_2, \ldots, v_n\}$ and $B' = \{v_1', v_2', \ldots, v_n'\}$ be two bases of $\mathbb{R}^n$. The **change-of-basis matrix from $B$ to $B'$**, denoted $P_{B \to B'}$, is the unique $n \times n$ matrix whose columns are the coordinate vectors of $v_1, v_2, \ldots, v_n$ expressed in the basis $B'$:

$$P_{B \to B'} = [[v_1]_{B'} \,|\, [v_2]_{B'} \,|\, \cdots \,|\, [v_n]_{B'}].$$

## Key Theorem (Coordinate Transformation)

If $x$ is a vector in $\mathbb{R}^n$, $[x]_B$ denotes its coordinate vector in basis $B$, and $[x]_{B'}$ denotes its coordinate vector in basis $B'$, then:

$$[x]_{B'} = P_{B \to B'}^{-1} [x]_B.$$

Equivalently, $[x]_B = P_{B \to B'} [x]_{B'}$.

**Special case:** When $B'$ is the standard basis $E$, we write $P = P_{B \to E}$ and get $[x]_E = P[x]_B$, where $P$ has the basis vectors of $B$ as columns.