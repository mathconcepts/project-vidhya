---
id: vector-algebra-basics.intuition
concept_id: vector-algebra-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.10
exam_ids: ["*"]
scaffold_fade: true
---

Two ideas cover almost everything about vectors before any formula. First, a vector is an arrow: magnitude and direction, nothing else — sliding it in space without turning or stretching it doesn't change which vector it is. Second, there are exactly two honest ways to multiply two vectors, and they answer different questions.

The **dot product** $\vec a\cdot\vec b=|\vec a||\vec b|\cos\theta$ answers "how much does $\vec b$ point along $\vec a$?" — it is a single number (a scalar), the signed length of $\vec b$'s shadow on $\vec a$, stretched by $|\vec a|$. Zero shadow means the vectors are perpendicular.

The **cross product** $\vec a\times\vec b$ answers a different question: it returns a new vector, perpendicular to both $\vec a$ and $\vec b$ (direction fixed by the right-hand rule), whose length $|\vec a||\vec b|\sin\theta$ equals the area of the parallelogram the two vectors span. Zero cross product means the vectors are parallel — no area to sweep out.

Stack a third vector on top and the **scalar triple product** $\vec a\cdot(\vec b\times\vec c)$ measures the volume of the parallelepiped the three vectors span — its sign says whether $\vec a,\vec b,\vec c$ form a right-handed or left-handed set, and a value of exactly zero means the three vectors are coplanar, however large each one looks alone.
