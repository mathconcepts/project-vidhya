---
id: vector-algebra-basics.common-traps
concept_id: vector-algebra-basics
atom_type: common_traps
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
---

- **Sign errors in the cross product:** the middle ($\hat{j}$) term of the determinant expansion carries a *minus* sign — $\vec{a}\times\vec{b} = (a_2b_3-a_3b_2)\hat{i} - (a_1b_3-a_3b_1)\hat{j} + (a_1b_2-a_2b_1)\hat{k}$. Students routinely drop that minus sign, flipping the resulting vector's direction.
- **Mixing up dot and cross products:** the dot product returns a *scalar*; the cross product returns a *vector*. Writing $\vec{a}\cdot\vec{b}$ as if it has components, or $\vec{a}\times\vec{b}$ as if it's a single number, signals this confusion — and it's an easy way to lose marks on an otherwise correct method.
- **Assuming the cross product is commutative:** $\vec{a}\times\vec{b} = -(\vec{b}\times\vec{a})$, not $\vec{b}\times\vec{a}$. Swapping the order flips the sign of every component.
- **"Both vectors are in a plane, so their cross product must be zero":** false. Two coplanar (but non-parallel) vectors have a cross product perpendicular to *that* plane — only truly **parallel** vectors give a zero cross product.
- **Ignoring the sign of the scalar triple product:** only whether $[\vec{a}\ \vec{b}\ \vec{c}]$ is *zero* determines coplanarity. A negative value still means the vectors are NOT coplanar — the sign only encodes orientation (handedness), not "flatness."
- **Forgetting to divide by magnitudes when finding an angle:** $\cos\theta = \vec{a}\cdot\vec{b}$ alone is wrong; you must divide by $|\vec{a}||\vec{b}|$ to get a value that's actually a valid cosine (between $-1$ and $1$).
