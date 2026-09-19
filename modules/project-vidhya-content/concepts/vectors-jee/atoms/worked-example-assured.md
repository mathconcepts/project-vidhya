---
id: vectors-jee.worked-example-assured
concept_id: vectors-jee
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
variant_of: vectors-jee.worked-example
for_stance: assured
---

Vertices $A(1,1,1)$, $B(2,0,3)$, $C(3,1,2)$, $D(1,2,0)$. Volume $=\dfrac{1}{6}|[\vec{AB}\ \vec{AC}\ \vec{AD}]|$.

$$\vec{AB}=(1,-1,2),\ \vec{AC}=(2,0,1),\ \vec{AD}=(0,1,-1)$$

$$\vec{AC}\times\vec{AD}=(-1,2,2),\qquad \vec{AB}\cdot(-1,2,2)=1\ \Rightarrow\ \text{Volume}=\frac{1}{6}$$

The distinction that costs marks: which vertex you call the "corner" **does not matter**. Redo it from $B$ instead — $\vec{BA}=(-1,1,-2)$, $\vec{BC}=(1,1,-1)$, $\vec{BD}=(-1,2,-3)$ — and $[\vec{BA}\ \vec{BC}\ \vec{BD}]=-1$, giving the same $\frac{1}{6}$. The triple product's sign flips with the vertex and the order of the edges; its absolute value, and so the volume, never does. Do not waste time hunting for the "correct" starting vertex — any one gives the right magnitude.

A second trap: forgetting the $\frac16$ and reporting the parallelepiped's volume instead of the tetrahedron's is the single most common slip on this exact question type.
