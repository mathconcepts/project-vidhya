---
id: three-d-geometry.intuition
concept_id: three-d-geometry
atom_type: intuition
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
---

A line's vector form, $\vec r=\vec a+\lambda\vec b$, and its Cartesian form, $\dfrac{x-x_1}{a}=\dfrac{y-y_1}{b}=\dfrac{z-z_1}{c}$, are not two different facts — they are the same direction, written twice. The point $(x_1,y_1,z_1)$ is $\vec a$'s coordinates. The numbers $a,b,c$ under the fractions are $\vec b$'s components. Read a Cartesian line and you already have its vector direction; nothing new to compute.

The same holds for a plane. $\vec r\cdot\vec n=d$ and $ax+by+cz=d$ share one fact: $\vec n=(a,b,c)$ is the plane's normal, sitting right there as the coefficients.

Why keep both forms at all? Vector form makes derivations short — the shortest distance between two skew lines, for instance, falls out of one cross product and one dot product with almost no bookkeeping. Cartesian form is what a question usually hands you, and what a final answer usually needs to check against. Fluency means reading one and writing the other without pausing to "convert" — because there is nothing to convert, only to relabel.
