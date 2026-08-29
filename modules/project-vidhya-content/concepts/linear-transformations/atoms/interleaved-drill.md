---
id: linear-transformations.interleaved-drill
concept_id: linear-transformations
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: linear-transformations.micro-exercise
---

**Cross-concept check: a transformation's matrix → rank-nullity.**

$T: \mathbb{R}^3 \to \mathbb{R}^3$ defined by $T(x, y, z) = (x + y,\; y + z,\; x + 2y + z)$.

**Question 1 (linear transformations):** Write the matrix of $T$ in the standard basis.

*Answer:* Feed it the basis vectors and collect the results as **columns**. $T(e_1) = (1, 0, 1)$, $T(e_2) = (1, 1, 2)$, $T(e_3) = (0, 1, 1)$, so

$$A = \begin{pmatrix} 1 & 1 & 0 \\ 0 & 1 & 1 \\ 1 & 2 & 1 \end{pmatrix}$$

Sanity check: $A(x,y,z)^T = (x+y,\; y+z,\; x+2y+z)^T$ ✓ — reproduces $T$.

**Question 2 (rank-nullity):** Find $\text{rank}(T)$ and $\text{nullity}(T)$, and decide whether $T$ is injective or surjective.

*Answer:* Row 3 $=$ Row 1 $+$ Row 2, so the rows are dependent and $\text{rank}(A) = 2$ (verified). Rank-nullity then *gives* the other number rather than making you compute it:

$$\text{nullity} = 3 - \text{rank} = 3 - 2 = 1$$

The kernel is spanned by $(1, -1, 1)$ (verified) — check it: $1 + (-1) = 0$ ✓, $-1 + 1 = 0$ ✓, $1 - 2 + 1 = 0$ ✓.

Nullity $1 \neq 0$, so $T$ is **not injective**. Rank $2 < 3 = \dim(\mathbb{R}^3)$, so $T$ is **not surjective** either — and for a map from a space to itself, those two failures are the same failure.

**Why this drill exists:** students compute rank and nullity as two separate jobs and then "verify" that they sum to $n$, as if the theorem were a coincidence to confirm. It is a **constraint**: compute whichever is cheaper — usually the rank, from one row reduction — and read the other off. The second half of the misconception is treating "not injective" and "not surjective" as independent findings on a square map; for $T: V \to V$ with $\dim V$ finite, rank-nullity forces them to stand or fall together.
