---
id: vector-algebra-basics.formal-definition
concept_id: vector-algebra-basics
atom_type: formal_definition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
---

For $\vec a=(a_1,a_2,a_3)$, $\vec b=(b_1,b_2,b_3)$, with magnitude $|\vec a|=\sqrt{a_1^2+a_2^2+a_3^2}$. The **position vector** of $P(x,y,z)$ is $\overrightarrow{OP}=x\hat\imath+y\hat\jmath+z\hat k$; the vector from $A$ to $B$ is $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$.

**Dot product.** $\vec a\cdot\vec b=a_1b_1+a_2b_2+a_3b_3=|\vec a||\vec b|\cos\theta$. Commutative: $\vec a\cdot\vec b=\vec b\cdot\vec a$.

**Cross product.** $\vec a\times\vec b=\begin{vmatrix}\hat\imath&\hat\jmath&\hat k\\ a_1&a_2&a_3\\ b_1&b_2&b_3\end{vmatrix}$, with $|\vec a\times\vec b|=|\vec a||\vec b|\sin\theta$. **Anti-commutative**: $\vec a\times\vec b=-(\vec b\times\vec a)$.

**Scalar triple product.** $[\vec a\ \vec b\ \vec c]=\vec a\cdot(\vec b\times\vec c)$, a $3\times3$ determinant of the three vectors as rows. Vanishes **iff** $\vec a,\vec b,\vec c$ are coplanar.

**Method selector.** Reach for the dot product when the question asks about angle, projection, or perpendicularity (one number back); reach for the cross product or triple product when it asks about area, volume, a perpendicular direction, or coplanarity. A frequent wrong move: testing whether three vectors are coplanar by computing only $\vec a\times\vec b$ — a cross product relates two vectors and cannot see a third one at all; that test needs the triple product.
