---
id: three-d-geometry.intuition-assured
concept_id: three-d-geometry
atom_type: intuition
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
variant_of: three-d-geometry.intuition
for_stance: assured
---

Vector and Cartesian forms are the same object under two labels: $\vec a\leftrightarrow(x_1,y_1,z_1)$, $\vec b\leftrightarrow(a,b,c)$ for a line; $\vec n\leftrightarrow(a,b,c)$ for a plane. Reading one off the other is relabeling, never computation.

The distinction that actually costs marks: direction **ratios** are any nonzero scalar multiple of a direction — $(2,3,6)$ and $(-4,-6,-12)$ describe the identical line. Direction **cosines** are the one specific normalized triple with $l^2+m^2+n^2=1$. Angle formulas — line to line, line to plane, plane to plane — divide one dot product by a product of magnitudes, so ratios and cosines give the identical answer there; the scale cancels. A **projection length**, $\Delta x\,l+\Delta y\,m+\Delta z\,n$, does not cancel anything — it is a genuine length, and it is only correct with true direction cosines. Feed it raw ratios $(1,2,2)$ instead of the cosines $(\tfrac13,\tfrac23,\tfrac23)$ and a projection that should read $5$ comes out $15$ — three times too large, exactly the unnormalized magnitude you forgot to divide by.

The second distinction: coplanar is a weaker claim than parallel. Two lines can lie in one plane while still crossing at an angle — coplanar only rules out skewness, not intersection, and says nothing about direction.
