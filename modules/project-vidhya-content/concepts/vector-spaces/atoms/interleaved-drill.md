---
id: vector-spaces.interleaved-drill
concept_id: vector-spaces
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: vector-spaces.micro-exercise
---

**Cross-concept check: vector spaces → linear independence.**

$$W = \{(x, y, z) \in \mathbb{R}^3 : x - 2y + z = 0\}$$

**Question 1 (is it a subspace, and how big?):** Apply Zero–Add–Scale, then state $\dim W$.

*Answer:* **Zero:** $0 - 2(0) + 0 = 0$ ✓. **Add:** if $x_1-2y_1+z_1 = 0$ and $x_2-2y_2+z_2 = 0$, adding the two equations gives $(x_1+x_2) - 2(y_1+y_2) + (z_1+z_2) = 0$ ✓. **Scale:** multiplying the equation by $c$ gives $cx - 2cy + cz = c \cdot 0 = 0$ ✓. So $W$ is a subspace — a plane through the origin.

Dimension without finding a basis: $W$ is the null space of the $1\times3$ matrix $[\,1\ \ {-2}\ \ 1\,]$, whose rank is $1$, so $\dim W = 3 - 1 = 2$.

**Question 2 (independence inside it):** Let $v_1 = (2,1,0)$, $v_2 = (1,1,1)$, $v_3 = (3,2,1)$. First confirm all three lie in $W$, then decide whether they are linearly independent.

*Answer:* Membership is one dot product each against $(1,-2,1)$: $2-2+0 = 0$ ✓, $1-2+1 = 0$ ✓, $3-4+1 = 0$ ✓. All three live in $W$.

Independent? **No — and you can answer before computing.** $\dim W = 2$, so any set of three vectors inside $W$ *must* be dependent; there is no room for a third independent direction in a plane. The explicit relation confirms it: $v_1 + v_2 = (3,2,1) = v_3$, so $v_1 + v_2 - v_3 = \mathbf{0}$ is a non-trivial combination giving zero. (Verified: the matrix with these three rows has rank $2$, not $3$.) Any two of them, being non-parallel, *are* independent — and therefore form a basis of $W$.

**Why this drill exists:** students treat "is it a subspace?" and "are these independent?" as two unrelated procedures and grind out a $3\times3$ determinant for Question 2. The dimension found in Question 1 already decided it. The misconception targeted is the belief that independence must always be tested computationally — once the ambient subspace's dimension is known, a count settles every set larger than it, and no row reduction is needed.
