---
id: kinematics-2d.intuition
concept_id: kinematics-2d
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
---

Any vector in a plane — a displacement, a velocity, a force — can be broken into two perpendicular pieces, usually horizontal and vertical, once a positive direction is fixed on each axis. This is **resolution of vectors**: $u_x=u\cos\theta$, $u_y=u\sin\theta$, where $\theta$ is measured from the positive $x$-axis. The two pieces are found and used *completely separately*; they only ever come back together at the very last step, if a final combined answer is asked for.

**Projectile motion** under gravity alone is the clearest use of this: horizontally, no force acts, so $v_x$ never changes. Vertically, gravity gives constant acceleration $-g$ (upward positive), exactly the one-dimensional equations already known. The projectile's path traced out over time is a parabola — the shape appears automatically because $x$ grows linearly with time while $y$ has a $t^2$ term in it.

**Uniform circular motion** looks different but uses the same idea in reverse: speed stays constant, but the *direction* of velocity keeps changing, which itself is a form of acceleration — the **centripetal acceleration** $a_c=v^2/r$, always pointing from the object toward the centre of the circle, never along the direction of motion.

**Relative velocity in two dimensions** is vector subtraction, done component by component: $\vec{v}_{AB}=\vec{v}_A-\vec{v}_B$ means subtract the $x$-components and the $y$-components separately, then recombine if a single magnitude and direction are needed.

