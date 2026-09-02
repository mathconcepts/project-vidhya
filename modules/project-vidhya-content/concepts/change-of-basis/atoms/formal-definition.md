---
id: change-of-basis.formal-definition
concept_id: change-of-basis
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

Let $B=\{v_1,\ldots,v_n\}$ and $B'=\{v_1',\ldots,v_n'\}$ be two bases of $\mathbb{R}^n$. The **change-of-basis matrix from $B$ to $B'$**, denoted $P_{B\to B'}$, is the $n\times n$ matrix whose columns are the coordinate vectors of $v_1,\ldots,v_n$ expressed in $B'$:

$$P_{B\to B'} = \big[\,[v_1]_{B'} \mid [v_2]_{B'} \mid \cdots \mid [v_n]_{B'}\,\big]$$

**Coordinate Transformation.** If $[x]_B$ and $[x]_{B'}$ denote $x$'s coordinate vectors in $B$ and $B'$:

$$[x]_{B'} = P_{B\to B'}^{-1}\, [x]_B, \qquad\text{equivalently}\qquad [x]_B = P_{B\to B'}\, [x]_{B'}$$

**Special case.** When $B'$ is the standard basis $E$, write $P = P_{B\to E}$: $[x]_E = P[x]_B$, where $P$'s columns are simply $B$'s vectors in standard coordinates.

**Method Selector.** Use $P$ (columns = the new basis vectors, written in the old coordinates) whenever you need $[x]$ in one basis from $[x]$ in another — one matrix multiplication (or its inverse) does the whole conversion. Don't set up and solve a fresh linear system from scratch each time; that reproduces exactly what $P$ (or $P^{-1}$) already encodes, at several times the effort.
