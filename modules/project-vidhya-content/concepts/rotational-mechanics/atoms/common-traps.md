---
id: rotational-mechanics.common-traps
concept_id: rotational-mechanics
atom_type: common_traps
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
---

- **Applying the parallel axis theorem without fixing the axis first**: $I=I_{cm}+Md^2$ only works when $I_{cm}$ is about an axis through the centre of mass that is **parallel** to the target axis. Decide *which* axis the question wants (through the centre? through an edge? through a point of contact?) before writing this formula down — plugging in a $d$ measured to the wrong axis, or using a non-parallel axis, produces a confidently wrong number.

- **Confusing rolling without slipping with pure rotation about a fixed point**: a disc rolling down an incline has its centre of mass genuinely *translating*, so its total kinetic energy needs both $\tfrac12Mv_{cm}^2$ and $\tfrac12I_{cm}\omega^2$. A ceiling fan blade, rotating about a truly fixed axis, has only rotational kinetic energy — no translation term at all. Using the fan's one-term formula for the rolling disc silently throws away half the energy account.

- **Assuming angular momentum is conserved whenever "nothing seems to be pushing"**: friction at a wheel's contact point, or a support at a pivot, can supply a real external torque even when no one is visibly pushing anything. $L=I\omega$ is conserved only when the net external *torque* is genuinely zero — check for torque sources, not just visible forces.

- **Sign confusion in torque direction**: once counter-clockwise is fixed as positive, every clockwise torque must be written negative, including for forces you'd otherwise call "helping" the motion. Mixing signs mid-calculation (calling one torque positive because it "feels like the main one") makes the net torque, and everything built on it, wrong.

- **Treating $v=\omega R$ as always true**: this rolling-without-slipping condition only holds when there is no sliding at the contact point. The instant a problem says a wheel is skidding or slipping, $v$ and $\omega$ become independent quantities — using $v=\omega R$ there is applying a rule the problem has explicitly ruled out.

