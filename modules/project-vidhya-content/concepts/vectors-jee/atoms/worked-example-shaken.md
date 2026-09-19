---
id: vectors-jee.worked-example-shaken
concept_id: vectors-jee
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
variant_of: vectors-jee.worked-example
for_stance: shaken
---

**Problem.** $A(1,1,1)$, $B(2,0,3)$, $C(3,1,2)$, $D(1,2,0)$ are the vertices of a tetrahedron. Find its volume.

**Step 1.** Pick one vertex, $A$, and write the other three points as vectors from it. Subtract coordinates, in order:

$$\vec{AB}=(2-1,0-1,3-1)=(1,-1,2)$$
$$\vec{AC}=(3-1,1-1,2-1)=(2,0,1)$$
$$\vec{AD}=(1-1,2-1,0-1)=(0,1,-1)$$

**Step 2.** These three vectors span a box. The tetrahedron is one-sixth of that box. So find the box's volume first: cross $\vec{AC}$ with $\vec{AD}$.

$$\vec{AC}\times\vec{AD}=\begin{vmatrix}\hat i&\hat j&\hat k\\2&0&1\\0&1&-1\end{vmatrix}=\hat i(0\cdot(-1)-1\cdot1)-\hat j(2\cdot(-1)-1\cdot0)+\hat k(2\cdot1-0\cdot0)$$

$$=\hat i(-1)-\hat j(-2)+\hat k(2)=(-1,2,2)$$

**Step 3.** Dot this result with $\vec{AB}$:

$$(1,-1,2)\cdot(-1,2,2)=(1)(-1)+(-1)(2)+(2)(2)=-1-2+4=1$$

**Step 4.** This number, $1$, is the box's signed volume. Take the absolute value and divide by $6$:

$$\text{Volume}=\frac{|1|}{6}=\frac{1}{6}$$

**Check:** volume must be positive. $\frac{1}{6}>0$. Correct.
