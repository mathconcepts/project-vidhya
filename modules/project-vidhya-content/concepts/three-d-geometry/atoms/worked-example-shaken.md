---
id: three-d-geometry.worked-example-shaken
concept_id: three-d-geometry
atom_type: worked_example
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
variant_of: three-d-geometry.worked-example
for_stance: shaken
---

**Problem.** Find the shortest distance between:

$$\frac{x-1}{1}=\frac{y-2}{-1}=\frac{z-1}{1}\qquad\text{and}\qquad\frac{x-2}{2}=\frac{y+1}{1}=\frac{z+1}{2}$$

**Step 1 — read off a point and a direction from each line.** From the first equation: point $A_1=(1,2,1)$, direction $\vec b_1=(1,-1,1)$. From the second: point $A_2=(2,-1,-1)$, direction $\vec b_2=(2,1,2)$.

**Step 2 — why not just measure along one of the lines?** The shortest gap between the two lines is along the one direction perpendicular to *both* of them at once — sliding along either line only moves you sideways relative to that one special direction, never closer. That special direction is $\vec b_1\times\vec b_2$.

**Step 3 — compute $\vec b_1\times\vec b_2$:**

$$\vec b_1\times\vec b_2=\begin{vmatrix}\hat i&\hat j&\hat k\\1&-1&1\\2&1&2\end{vmatrix}=\hat i(-2-1)-\hat j(2-2)+\hat k(1+2)=(-3,0,3)$$

**Step 4 — find the vector connecting the two points**, $A_2-A_1=(2-1,-1-2,-1-1)=(1,-3,-2)$.

**Step 5 — dot Step 4 into Step 3:**

$$(1,-3,-2)\cdot(-3,0,3)=(1)(-3)+(-3)(0)+(-2)(3)=-3+0-6=-9$$

**Step 6 — find $|\vec b_1\times\vec b_2|$:**

$$\sqrt{(-3)^2+0^2+3^2}=\sqrt{18}=3\sqrt2$$

**Step 7 — divide, using the absolute value:**

$$d=\frac{|-9|}{3\sqrt2}=\frac{9}{3\sqrt2}=\frac{3}{\sqrt2}=\frac{3\sqrt2}{2}\approx2.12$$

**Check:** since $-9\neq0$, the lines really do not meet — the calculation is measuring a real gap, not a coincidence of zero.
