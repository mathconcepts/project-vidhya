---
id: three-d-geometry.worked-example
concept_id: three-d-geometry
atom_type: worked_example
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
---

**Problem.** Find the shortest distance between the lines

$$\vec r_1=(\hat i+2\hat j+\hat k)+\lambda(\hat i-\hat j+\hat k),\qquad \frac{x-1}{1}=\frac{y-2}{-1}=\frac{z-1}{1}$$

$$\vec r_2=(2\hat i-\hat j-\hat k)+\mu(2\hat i+\hat j+2\hat k),\qquad \frac{x-2}{2}=\frac{y+1}{1}=\frac{z+1}{2}$$

The vector form and the Cartesian form here are the exact same two lines, written twice — that will matter in a moment.

**Step 1 — why a formula for this exists at all.** Pick any point $P$ on line 1 and any point $Q$ on line 2. Slide $P$ along its line — this only ever adds a multiple of $\vec b_1$ to $\vec{PQ}$. Slide $Q$ — this only adds a multiple of $\vec b_2$. The one direction unaffected by either slide is $\vec n=\vec b_1\times\vec b_2$, since $\vec n$ is perpendicular to both $\vec b_1$ and $\vec b_2$ by construction. So however you slide $P$ and $Q$, the *component of $\vec{PQ}$ along $\vec n$* never changes — and the shortest possible $\vec{PQ}$ is exactly that unchanging component, with nothing extra added along either line's own direction. **The shortest distance is the length of that fixed perpendicular component, not a distance measured along either line.**

**Step 2 — read off the vectors.** Both forms agree: line 1 passes through $A_1=(1,2,1)$ with direction $\vec b_1=(1,-1,1)$; line 2 passes through $A_2=(2,-1,-1)$ with direction $\vec b_2=(2,1,2)$. Check the Cartesian equations directly: the numerators give the same two points, the denominators give the same two directions. No conversion needed — only reading.

**Step 3 — build $\vec n=\vec b_1\times\vec b_2$**, the one direction the projection in Step 1 needs:

$$\vec n=\begin{vmatrix}\hat i&\hat j&\hat k\\1&-1&1\\2&1&2\end{vmatrix}=\hat i(-2-1)-\hat j(2-2)+\hat k(1+2)=(-3,0,3)$$

Since $\vec b_1$ and $\vec b_2$ are not scalar multiples of each other, the lines are not parallel — a necessary check before calling them skew.

**Step 4 — project the connecting vector onto $\vec n$.** $\vec{A_1A_2}=A_2-A_1=(1,-3,-2)$:

$$\vec{A_1A_2}\cdot\vec n=(1)(-3)+(-3)(0)+(-2)(3)=-3+0-6=-9$$

This is nonzero, confirming the lines do not meet — they really are skew, not merely non-parallel.

**Step 5 — divide by $|\vec n|$** to turn the projection into an actual length:

$$|\vec n|=\sqrt{9+0+9}=3\sqrt2,\qquad d=\frac{|-9|}{3\sqrt2}=\frac{9}{3\sqrt2}=\frac{3}{\sqrt2}=\frac{3\sqrt2}{2}\approx2.12\ \text{units}$$

Whether you started reading vectors off the vector form or off the Cartesian form, the numbers going into Steps 2 through 5 are identical — that is exactly the fluency this concept is built around.
