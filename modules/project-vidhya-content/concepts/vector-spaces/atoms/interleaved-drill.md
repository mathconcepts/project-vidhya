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

**Cross-concept check: vector spaces → rank-nullity.**

$$W = \{(x, y, z) \in \mathbb{R}^3 : x - 2y + z = 0\}$$

**Question 1 (is it a subspace, and how big?):** Apply Zero–Add–Scale, then state $\dim W$.

*Answer:* **Zero:** $0-2(0)+0=0$ ✓. **Add:** if $x_1-2y_1+z_1=0$ and $x_2-2y_2+z_2=0$, adding gives $(x_1+x_2)-2(y_1+y_2)+(z_1+z_2)=0$ ✓. **Scale:** multiplying by $c$ gives $c\cdot0=0$ ✓. $W$ is a subspace — a plane through the origin.

Dimension without finding a basis: $W$ is the null space of the $1\times3$ matrix $[1\ {-2}\ 1]$, rank $1$, so $\dim W = 3-1=2$.

**Question 2 (independence inside it):** Let $v_1=(2,1,0)$, $v_2=(1,1,1)$, $v_3=(3,2,1)$. First confirm all three lie in $W$, then decide whether they are linearly independent.

*Answer:* Membership: $2-2(1)+0=0$ ✓, $1-2(1)+1=0$ ✓, $3-2(2)+1=0$ ✓. All three live in $W$.

Independent? **No — answerable before computing.** $\dim W=2$, so any set of three vectors inside $W$ *must* be dependent; there's no room for a third independent direction in a plane. The relation confirms it: $v_1+v_2=(3,2,1)=v_3$, so $v_1+v_2-v_3=\mathbf{0}$ is non-trivial. Any two of them, being non-parallel, **are** independent and form a basis of $W$.

**Why this drill exists:** students treat "is it a subspace?" and "are these independent?" as two unrelated procedures and grind out a $3\times3$ determinant for Question 2. The dimension found in Question 1 already decided it — once the ambient subspace's dimension is known, a count settles any set larger than it, no row reduction needed.
