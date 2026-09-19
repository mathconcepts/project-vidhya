---
id: vectors-jee.formal-definition
concept_id: vectors-jee
atom_type: formal_definition
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
---

**Dot (scalar) product**: for $\vec a=a_1\hat i+a_2\hat j+a_3\hat k$ and $\vec b=b_1\hat i+b_2\hat j+b_3\hat k$,

$$\vec a\cdot\vec b=a_1b_1+a_2b_2+a_3b_3=|\vec a||\vec b|\cos\theta$$

**Cross (vector) product**:

$$\vec a\times\vec b=\begin{vmatrix}\hat i&\hat j&\hat k\\a_1&a_2&a_3\\b_1&b_2&b_3\end{vmatrix},\qquad |\vec a\times\vec b|=|\vec a||\vec b|\sin\theta$$

$\vec a\times\vec b$ is perpendicular to both $\vec a$ and $\vec b$; its direction follows the right-hand rule, and $\vec b\times\vec a=-(\vec a\times\vec b)$.

**Scalar triple product**: $[\vec a\ \vec b\ \vec c]=\vec a\cdot(\vec b\times\vec c)$, equal to the determinant of the three vectors written as rows. Geometrically, $|[\vec a\ \vec b\ \vec c]|$ is the volume of the parallelepiped with $\vec a,\vec b,\vec c$ as edges from one vertex. **$\vec a,\vec b,\vec c$ are coplanar exactly when $[\vec a\ \vec b\ \vec c]=0$.**

**Vector triple product**: $\vec a\times(\vec b\times\vec c)=\vec b(\vec a\cdot\vec c)-\vec c(\vec a\cdot\vec b)$ — the "BAC minus CAB" rule. The result always lies in the plane of $\vec b$ and $\vec c$, since it is a combination of only those two vectors.

**Unit vector**: $\hat a=\vec a/|\vec a|$, defined only when $\vec a\neq\vec 0$.

**Angle between two vectors**: $\cos\theta=\dfrac{\vec a\cdot\vec b}{|\vec a||\vec b|}$.

**Method selector.** Need a plain number comparing two directions (angle, projection, work done)? Use the dot product. Need a vector perpendicular to two given ones, or an area? Use the cross product. Need a volume, or a fast coplanarity check for three vectors? Use the scalar triple product — computing it directly is faster than finding two normals and comparing them.
