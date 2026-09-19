---
id: three-d-geometry.formal-definition
concept_id: three-d-geometry
atom_type: formal_definition
bloom_level: 2
difficulty: 0.45
exam_ids: ["*"]
---

**Direction ratios**: any triple $(a,b,c)$ proportional to a line's direction vector $\vec b$. Not unique — any nonzero scalar multiple represents the same direction.

**Direction cosines**: the one normalized triple $(l,m,n)=\left(\dfrac{a}{\sqrt{a^2+b^2+c^2}},\dfrac{b}{\sqrt{a^2+b^2+c^2}},\dfrac{c}{\sqrt{a^2+b^2+c^2}}\right)$, always satisfying $l^2+m^2+n^2=1$.

**Line, vector form**: $\vec r=\vec a+\lambda\vec b$, where $\vec a$ is the position vector of one known point and $\vec b$ is the direction. **Cartesian form**: $\dfrac{x-x_1}{a}=\dfrac{y-y_1}{b}=\dfrac{z-z_1}{c}$ — same $(x_1,y_1,z_1)=\vec a$, same $(a,b,c)=\vec b$.

**Plane, vector form**: $\vec r\cdot\hat n=d$. **Cartesian form**: $ax+by+cz=d$, with $\vec n=(a,b,c)$ the normal vector, same in both.

**Coplanarity of two lines** $L_1:\vec a_1+\lambda\vec b_1$ and $L_2:\vec a_2+\mu\vec b_2$: coplanar exactly when $(\vec a_2-\vec a_1)\cdot(\vec b_1\times\vec b_2)=0$. If also $\vec b_1\parallel\vec b_2$, the lines are parallel; otherwise they intersect at one point.

**Skew lines**: two lines that are **not parallel** and **do not intersect** — equivalently, $(\vec a_2-\vec a_1)\cdot(\vec b_1\times\vec b_2)\neq0$.

**Shortest distance between skew lines**:

$$d=\frac{\left|(\vec a_2-\vec a_1)\cdot(\vec b_1\times\vec b_2)\right|}{|\vec b_1\times\vec b_2|}$$

**Shortest distance between parallel lines** (common direction $\vec b$, points $\vec a_1,\vec a_2$):

$$d=\frac{|\vec b\times(\vec a_2-\vec a_1)|}{|\vec b|}$$

**Angle between two planes** with normals $\vec n_1,\vec n_2$:

$$\cos\theta=\frac{|\vec n_1\cdot\vec n_2|}{|\vec n_1||\vec n_2|}$$

**Angle between a line** (direction $\vec b$) **and a plane** (normal $\vec n$) — measured from the plane, not from the normal, so the roles of sine and cosine swap:

$$\sin\theta=\frac{|\vec b\cdot\vec n|}{|\vec b||\vec n|}$$

**Distance of a point $(x_0,y_0,z_0)$ from a plane** $ax+by+cz=d$:

$$D=\frac{|ax_0+by_0+cz_0-d|}{\sqrt{a^2+b^2+c^2}}$$

**Method selector.** Given a plane's equation directly, read $\vec n$ off the coefficients — never re-derive it. Given two vectors known to lie in a plane instead, build $\vec n$ from their cross product first. Every angle formula above takes an absolute value, because "angle between" a line and a plane, or between two planes, is defined as the acute angle by convention — a formula answer without the absolute value can come out obtuse or negative, which is not what the question is asking for.
