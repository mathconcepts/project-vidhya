---
id: rotational-mechanics.intuition
concept_id: rotational-mechanics
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Every linear-motion idea has a rotational twin: force becomes **torque** ($\tau = rF\sin\theta$, the turning effect of a force), mass becomes **moment of inertia** ($I=\sum mr^2$, how spread-out the mass is from the spin axis), and Newton's second law becomes $\tau = I\alpha$. A mass spread far from the axis (a hoop) resists spinning up more than the same mass packed close to the axis (a solid disc) — moment of inertia depends on *how the mass is arranged*, not just how much there is.

**Which axis** the moment of inertia is measured about always matters, and it must be fixed before writing any formula down. If a body's moment of inertia about an axis through its own centre of mass is $I_{cm}$, then about a *parallel* axis a distance $d$ away, the **parallel axis theorem** gives $I = I_{cm} + Md^2$ — always an *addition*, since moving the axis away from the centre of mass can only make the body harder to spin, never easier.

**Angular momentum** $L=I\omega$ is conserved exactly when net external torque is zero — the rotational sibling of linear momentum conservation. This restriction is easy to miss: a spinning top slowing down due to friction at its tip *does* have angular momentum changing, because friction there provides a real external torque; a skater pulling in her arms, with no such external torque, keeps $L$ fixed even as $I$ and $\omega$ both change.

