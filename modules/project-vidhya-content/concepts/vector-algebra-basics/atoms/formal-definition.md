---
id: vector-algebra-basics.formal-definition
concept_id: vector-algebra-basics
atom_type: formal_definition
bloom_level: 2
difficulty: 0.18
exam_ids: ["*"]
---

**Vector in $\mathbb{R}^3$**: $\vec{a} = a_1\hat{i} + a_2\hat{j} + a_3\hat{k}$, with magnitude $|\vec{a}| = \sqrt{a_1^2 + a_2^2 + a_3^2}$. The **position vector** of a point $P(x, y, z)$ is $\overrightarrow{OP} = x\hat{i} + y\hat{j} + z\hat{k}$. The **direction vector** from $A$ to $B$ is $\overrightarrow{AB} = \overrightarrow{OB} - \overrightarrow{OA}$. The **direction cosines** $(l, m, n)$ of $\vec{a}$ are its components divided by its magnitude, and always satisfy $l^2 + m^2 + n^2 = 1$.

**Dot (scalar) product**: For $\vec{a} = (a_1, a_2, a_3)$ and $\vec{b} = (b_1, b_2, b_3)$,
$$\vec{a} \cdot \vec{b} = a_1b_1 + a_2b_2 + a_3b_3 = |\vec{a}||\vec{b}|\cos\theta$$
where $\theta$ is the angle between them. The **scalar projection** of $\vec{a}$ onto $\vec{b}$ is $\dfrac{\vec{a}\cdot\vec{b}}{|\vec{b}|}$. Two nonzero vectors are perpendicular iff $\vec{a}\cdot\vec{b} = 0$.

**Cross (vector) product**:
$$\vec{a} \times \vec{b} = \begin{vmatrix} \hat{i} & \hat{j} & \hat{k} \\ a_1 & a_2 & a_3 \\ b_1 & b_2 & b_3 \end{vmatrix} = (a_2b_3 - a_3b_2)\hat{i} - (a_1b_3 - a_3b_1)\hat{j} + (a_1b_2 - a_2b_1)\hat{k}$$
with $|\vec{a} \times \vec{b}| = |\vec{a}||\vec{b}|\sin\theta$, equal to the **area of the parallelogram** spanned by $\vec{a}$ and $\vec{b}$; direction is given by the right-hand rule, and $\vec{a}\times\vec{b} = -(\vec{b}\times\vec{a})$ (anticommutative). Two nonzero vectors are parallel iff $\vec{a}\times\vec{b} = \vec{0}$.

**Scalar triple product**: For three vectors $\vec{a}, \vec{b}, \vec{c}$,
$$[\vec{a}\ \vec{b}\ \vec{c}] = \vec{a}\cdot(\vec{b}\times\vec{c}) = \begin{vmatrix} a_1 & a_2 & a_3 \\ b_1 & b_2 & b_3 \\ c_1 & c_2 & c_3 \end{vmatrix}$$
Its absolute value equals the **volume of the parallelepiped** formed by the three vectors. $\vec{a}, \vec{b}, \vec{c}$ are **coplanar** iff $[\vec{a}\ \vec{b}\ \vec{c}] = 0$.
