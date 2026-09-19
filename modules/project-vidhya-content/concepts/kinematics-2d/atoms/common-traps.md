---
id: kinematics-2d.common-traps
concept_id: kinematics-2d
atom_type: common_traps
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
---

- **Using $\sin\theta$ where $\cos\theta$ belongs, or the reverse, when resolving the launch velocity**: the horizontal component is always $u\cos\theta$ and the vertical component is always $u\sin\theta$, where $\theta$ is measured *from the horizontal axis*. Swapping them silently interchanges the range and height formulas' roles and produces numbers for the wrong quantity entirely.

- **Letting the horizontal and vertical calculations leak into each other**: plugging $u_x$ into a vertical-motion equation, or $g$ into a horizontal one. The two axes are governed by completely independent one-dimensional problems — the only place they legitimately meet is when $T$ (found from the vertical motion) is substituted into $R=u_xT$ to combine the answers at the very end.

- **Getting the sign of $g$ wrong once the frame is set to upward-positive**: after choosing upward as positive for the $y$-axis, $a_y$ must be written as $-g$ in every equation for that axis, including on the way *down* — gravity does not change sign just because the object has started falling.

- **Treating the range formula $R=\dfrac{u^2\sin2\theta}{g}$ as always valid**: it only holds when the launch and landing heights are equal (both at $y=0$ in the chosen frame). Launching from a height, or landing on a height, needs the time of flight found honestly from the vertical equation of motion for that specific situation, not this shortcut formula.

- **Confusing centripetal acceleration's direction with the direction of motion**: in uniform circular motion, velocity is tangent to the circle, but acceleration points radially inward, toward the centre — perpendicular to velocity, never along it. Drawing the acceleration arrow pointing forward (in the direction of travel) instead of inward is a frame-of-reference error specific to this kind of motion.

