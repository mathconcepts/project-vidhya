---
id: vector-algebra-basics.intuition
concept_id: vector-algebra-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
scaffold_fade: true
---

# Understanding Vectors: Magnitude, Direction, and How They Combine

A **vector** is an arrow in space: it has a length (magnitude) and a direction. In 3D, we write $\vec{a} = a_1\hat{i} + a_2\hat{j} + a_3\hat{k}$, where $a_1, a_2, a_3$ are the components along the three axes. A **position vector** just points from the origin to a specific point — if $P = (2, 3, 1)$, its position vector is $\overrightarrow{OP} = 2\hat{i} + 3\hat{j} + \hat{k}$. A **direction vector** points from one point to another, or shows "which way" without caring about start location: $\overrightarrow{AB} = \overrightarrow{OB} - \overrightarrow{OA}$.

## Three Key Ideas

**Dot product (a scalar answer)**: $\vec{a} \cdot \vec{b} = a_1b_1 + a_2b_2 + a_3b_3 = |\vec{a}||\vec{b}|\cos\theta$ measures *alignment*. Two vectors pointing the same way give a large positive dot product; perpendicular vectors give exactly zero; opposite vectors give a large negative number. It also tells you the **projection** — how much of $\vec{a}$ lies along $\vec{b}$'s direction — via $\text{proj} = \frac{\vec{a}\cdot\vec{b}}{|\vec{b}|}$.

**Cross product (a vector answer)**: $\vec{a} \times \vec{b}$ is a *new vector*, perpendicular to both $\vec{a}$ and $\vec{b}$, with magnitude $|\vec{a}||\vec{b}|\sin\theta$ — exactly the **area of the parallelogram** the two vectors span. Its direction follows the right-hand rule: curl your fingers from $\vec{a}$ to $\vec{b}$, your thumb points along $\vec{a} \times \vec{b}$.

**Scalar triple product (a volume test)**: $[\vec{a}\ \vec{b}\ \vec{c}] = \vec{a}\cdot(\vec{b}\times\vec{c})$ is the signed **volume of the parallelepiped** formed by three vectors. If it's zero, the three vectors are **coplanar** — they all lie flat in the same plane, with no 3D "box" between them.

## Why It Matters for GATE

Vector algebra is the language underneath line integrals, surface integrals, gradient/divergence/curl, and mechanics problems (work, torque, moments). A shaky grip on dot vs. cross product costs marks throughout vector calculus, not just here.

---
