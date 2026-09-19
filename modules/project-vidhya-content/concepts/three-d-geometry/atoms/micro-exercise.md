---
id: three-d-geometry.micro-exercise
concept_id: three-d-geometry
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
estimated_minutes: 3
---

Find the angle between the planes $x+y=4$ and $y+z=3$.

- **(A)** $30°$
- **(B)** $45°$
- **(C)** $60°$
- **(D)** $90°$
- **(E)** $120°$

<details>
<summary>Answer</summary>

**C**. Read the normals straight off the coefficients: $\vec n_1=(1,1,0)$ from $x+y+0z=4$, and $\vec n_2=(0,1,1)$ from $0x+y+z=3$. The constants $4$ and $3$ do not affect the angle between the planes at all — only the normals do.

$$\cos\theta=\frac{|\vec n_1\cdot\vec n_2|}{|\vec n_1||\vec n_2|}=\frac{|(1)(0)+(1)(1)+(0)(1)|}{\sqrt{2}\cdot\sqrt{2}}=\frac{1}{2}$$

$\theta=60°$. **(D)**, $90°$, is what you would get by wrongly assuming a zero constant term difference makes the planes perpendicular — it does not; only the dot product of the normals decides that.

</details>
