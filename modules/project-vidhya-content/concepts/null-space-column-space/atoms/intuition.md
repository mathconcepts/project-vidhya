---
id: null-space-column-space.intuition
concept_id: null-space-column-space
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

The **null space** is the geometric shadow of a matrix: vectors that, when multiplied by $A$, disappear to zero. Visually, imagine a light shining through a 3D structure onto a 2D screen—the null space is the set of directions that cast no shadow. The **column space** is the opposite: it's the set of all possible outputs—everything the matrix can reach by multiplying from the right. For a 3×4 matrix, the null space might be a line (1D dimension) while the column space might be a 2D plane in $\mathbb{R}^3$. The rank-nullity theorem ties them together: if you add the dimension of null space and column space in the domain, you always get the number of columns.