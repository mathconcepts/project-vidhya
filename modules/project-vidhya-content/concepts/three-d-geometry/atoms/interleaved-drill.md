---
id: three-d-geometry.interleaved-drill
concept_id: three-d-geometry
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
modality: drill
tested_by_atom: three-d-geometry.micro-exercise
---

**Cross-concept check: three-dimensional geometry → vectors.** The plane $2x-y+2z=7$ is given.

**Question 1 (three-dimensional geometry):** State the plane's normal vector and its direction cosines.

*Answer:* Read the normal straight off the coefficients: $\vec n=(2,-1,2)$. Its magnitude is $\sqrt{4+1+4}=\sqrt9=3$, so the direction cosines are

$$(l,m,n)=\left(\frac23,-\frac13,\frac23\right)$$

Check: $\left(\frac23\right)^2+\left(-\frac13\right)^2+\left(\frac23\right)^2=\frac49+\frac19+\frac49=\frac99=1$. Confirmed.

**Question 2 (vectors):** Does $\vec w=\hat i+2\hat j$ represent a direction lying *within* this plane, or does it point out of the plane?

*Answer:* A direction lies within the plane exactly when it is perpendicular to the plane's normal — that is a dot product check, not a cross product one.

$$\vec n\cdot\vec w=(2)(1)+(-1)(2)+(2)(0)=2-2+0=0$$

The dot product is $0$, so $\vec w$ is perpendicular to $\vec n$ — it points along a direction lying in the plane.

**Why this drill exists:** once a plane's normal is read off its equation, deciding whether some other vector runs along the plane or pokes out of it is a plain dot-product question, not a fresh piece of 3D theory — the two topics share this one check constantly.
