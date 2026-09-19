---
id: rotational-mechanics.formal-definition
concept_id: rotational-mechanics
atom_type: formal_definition
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
---

**Centre of mass** (of a system of particles): $x_{cm} = \dfrac{\sum m_i x_i}{\sum m_i}$ (and similarly for $y$, $z$).

**Torque**: $\vec\tau = \vec r \times \vec F$, magnitude $\tau = rF\sin\theta$, where $\theta$ is the angle between the position vector $\vec r$ (from the axis to the point of application) and the force $\vec F$. Taken positive for counter-clockwise rotation, negative for clockwise, once an axis and a positive sense are fixed.

**Moment of inertia**: $I = \sum m_ir_i^2$ (discrete masses) or $I = \int r^2\,dm$ (continuous body), where $r$ is distance from the chosen axis.

**Parallel axis theorem**: $I = I_{cm} + Md^2$, where $I_{cm}$ is the moment of inertia about a parallel axis through the centre of mass, and $d$ is the perpendicular distance between the two parallel axes.

**Perpendicular axis theorem** (planar lamina only): $I_z = I_x + I_y$, for two perpendicular axes $x,y$ in the plane of the lamina and $z$ perpendicular to it, all meeting at one point.

**Angular momentum**: $L = I\omega$ (for rotation about a fixed axis). Conserved ($L$ constant) whenever net external torque about that axis is zero.

**Rotational kinetic energy**: $KE_{rot} = \tfrac12 I\omega^2$.

**Rolling without slipping** (a wheel or disc rolling on a surface, no sliding at the contact point): $v_{cm} = \omega R$, linking the centre of mass's linear speed to the angular speed. Total kinetic energy of a rolling body is $KE = \tfrac12 Mv_{cm}^2 + \tfrac12 I_{cm}\omega^2$ — translation and rotation, both counted.

