---
id: kinematics-2d.worked-example-assured
concept_id: kinematics-2d
atom_type: worked_example
variant_of: kinematics-2d.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A ball is launched from the ground at $u=20$ m/s at an angle $\theta$ where $\sin\theta=0.6$, $\cos\theta=0.8$. Take $g=10$ m/s$^2$. Find the time of flight, the maximum height, and the horizontal range.

---

**Set-up.** Origin at launch, $x$ along travel, $y$ upward: $a_x=0$, $a_y=-10$ m/s$^2$. $u_x=16$ m/s, $u_y=12$ m/s.

$$T=\dfrac{2u_y}{g}=2.4\text{ s}, \qquad H=\dfrac{u_y^2}{2g}=7.2\text{ m}, \qquad R=u_xT=38.4\text{ m}.$$

---

**Where the range shortcut quietly stops applying.** $R=u^2\sin2\theta/g$ gives $38.4$ m here only because the ball lands at the same height it was launched from — both endpoints sit at $y=0$. Send the same ball off a $5$ m platform instead, keeping everything else unchanged: solving $-5=u_yT-\tfrac{1}{2}gT^2$ for the new $T$ gives a value noticeably larger than $2.4$ s (the ball has an extra $5$ m to fall through), which then feeds a larger $R$ too. Reaching for the compact formula without first confirming level ground is how a correct-looking shortcut turns into a wrong number.

