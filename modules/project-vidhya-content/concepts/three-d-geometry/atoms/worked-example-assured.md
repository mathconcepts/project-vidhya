---
id: three-d-geometry.worked-example-assured
concept_id: three-d-geometry
atom_type: worked_example
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
variant_of: three-d-geometry.worked-example
for_stance: assured
---

Lines: $A_1=(1,2,1)$, $\vec b_1=(1,-1,1)$; $A_2=(2,-1,-1)$, $\vec b_2=(2,1,2)$ — read directly off either form, vector or Cartesian.

$$\vec n=\vec b_1\times\vec b_2=(-3,0,3),\qquad \vec{A_1A_2}=(1,-3,-2),\qquad \vec{A_1A_2}\cdot\vec n=-9$$

$$d=\frac{|-9|}{|\vec n|}=\frac{9}{3\sqrt2}=\frac{3\sqrt2}{2}\approx2.12$$

The distinction that costs marks: this formula measures perpendicular distance along $\vec n$, **not** along $\vec b_1$ or $\vec b_2$. A common wrong shortcut is projecting $\vec{A_1A_2}$ onto $\vec b_1$ instead — for these lines that gives $\dfrac{(1,-3,-2)\cdot(1,-1,1)}{|(1,-1,1)|}=\dfrac{1+3-2}{\sqrt3}=\dfrac{2}{\sqrt3}\approx1.15$, a plausible-looking number that is not the shortest distance at all, since $\vec{A_1A_2}$ still has a component along $\vec b_2$ that this projection throws away.

Second check, free of charge: $\vec b_1\cdot\vec n=(1)(-3)+(-1)(0)+(1)(3)=0$ and $\vec b_2\cdot\vec n=(2)(-3)+(1)(0)+(2)(3)=0$ — $\vec n$ really is perpendicular to both directions, confirming the cross product before trusting the rest of the computation.
