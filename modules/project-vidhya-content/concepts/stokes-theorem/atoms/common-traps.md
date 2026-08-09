---
id: stokes-theorem.common-traps
concept_id: stokes-theorem
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Right-hand rule confusion**: The orientation of curve $C$ and surface normal $\mathbf{n}$ must be consistent: if you curl your right hand's fingers along $C$, your thumb points along $\mathbf{n}$. Reversing one flips the sign. **Draw a picture** before applying Stokes' Theorem.

- **Curl calculation errors**: Computing $\nabla \times \mathbf{F}$ by hand is error-prone. Use the determinant form carefully: the $j$-component has a **minus sign** in front. Many students forget this and get sign errors that cascade through the answer.

- **Choosing the wrong surface**: A closed curve $C$ bounds **infinitely many** surfaces. You can use any one—pick the simplest! If $C$ is the intersection of a sphere and plane, use the disk in the plane (much easier than the spherical cap).
