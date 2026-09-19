---
id: vectors-jee.interleaved-drill
concept_id: vectors-jee
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
modality: drill
tested_by_atom: vectors-jee.micro-exercise
---

**Cross-concept check: vectors → three-dimensional geometry.** A plane contains two directions, $\vec u=\hat i+2\hat j-\hat k$ and $\vec v=2\hat i-\hat j+3\hat k$, and passes through the point $(2,0,1)$.

**Question 1 (vectors):** Find a vector normal to the plane.

*Answer:* Any vector perpendicular to both $\vec u$ and $\vec v$ is normal to their plane — that is exactly what the cross product gives.

$$\vec u\times\vec v=\begin{vmatrix}\hat i&\hat j&\hat k\\1&2&-1\\2&-1&3\end{vmatrix}=\hat i(2\cdot3-(-1)(-1))-\hat j(1\cdot3-(-1)\cdot2)+\hat k(1\cdot(-1)-2\cdot2)=(5,-5,-5)$$

Every component shares a factor of $5$, so $(1,-1,-1)$ is the same direction and easier to carry forward.

**Question 2 (three-dimensional geometry):** Using that normal, write the plane's Cartesian equation and find how far the point $(5,3,4)$ is from it.

*Answer:* A plane with normal $(a,b,c)$ through $(x_0,y_0,z_0)$ is $a(x-x_0)+b(y-y_0)+c(z-z_0)=0$. With $(1,-1,-1)$ through $(2,0,1)$:

$$1(x-2)-1(y-0)-1(z-1)=0\ \Rightarrow\ x-y-z=1$$

Distance of $(5,3,4)$ from a plane $ax+by+cz=d$ is $\dfrac{|ax_0+by_0+cz_0-d|}{\sqrt{a^2+b^2+c^2}}$:

$$\frac{|5-3-4-1|}{\sqrt{1+1+1}}=\frac{|-3|}{\sqrt3}=\sqrt3$$

**Why this drill exists:** a plane's Cartesian equation needs exactly the normal vector a cross product already hands you — the two skills are one calculation split across two topics, and JEE routinely tests both halves in the same multi-part question.
