---
id: vectors-jee.worked-example
concept_id: vectors-jee
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
---

**Problem.** $A(1,1,1)$, $B(2,0,3)$, $C(3,1,2)$, $D(1,2,0)$ are the four vertices of a tetrahedron. Find its volume.

**Step 1 — turn the vertices into vectors.** A volume needs edges from a single corner, not four scattered points. Pick $A$ as that corner and write the three edges out of it:

$$\vec{AB}=(1,-1,2),\qquad \vec{AC}=(2,0,1),\qquad \vec{AD}=(0,1,-1)$$

**Step 2 — recognise which tool measures a volume.** Three vectors from one point span a parallelepiped, and $|[\vec{AB}\ \vec{AC}\ \vec{AD}]|$ is exactly that box's volume — no need to separately find a base area and a height. A tetrahedron is one-sixth of that box, so the whole problem reduces to one determinant.

**Step 3 — compute $\vec{AC}\times\vec{AD}$ first**, so it can be dotted with $\vec{AB}$ next:

$$\vec{AC}\times\vec{AD}=\begin{vmatrix}\hat i&\hat j&\hat k\\2&0&1\\0&1&-1\end{vmatrix}=\hat i(0\cdot(-1)-1\cdot1)-\hat j(2\cdot(-1)-1\cdot0)+\hat k(2\cdot1-0\cdot0)=(-1,2,2)$$

**Step 4 — dot with $\vec{AB}$ to get the scalar triple product.** This is the one number that turns three vectors into a signed volume:

$$\vec{AB}\cdot(-1,2,2)=(1)(-1)+(-1)(2)+(2)(2)=-1-2+4=1$$

**Step 5 — divide by $6$**, because the tetrahedron is one-sixth of the parallelepiped, and take the absolute value since a volume is never negative:

$$\text{Volume}=\frac{|1|}{6}=\frac{1}{6}\ \text{cubic units}$$

**Why this is the exam-speed route.** Finding a triangle's area and then a perpendicular height by hand takes several steps and invites arithmetic slips. One $3\times3$ determinant, divided by $6$, gets the same answer in the time it takes to write the matrix down — this is the whole reason scalar triple products earn a place on the exam-speed shortlist.
