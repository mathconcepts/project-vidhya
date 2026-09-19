---
id: kinematics-2d.worked-example
concept_id: kinematics-2d
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A ball is launched from the ground at $u=20$ m/s at an angle $\theta$ where $\sin\theta=0.6$, $\cos\theta=0.8$. Take $g=10$ m/s$^2$. Find the time of flight, the maximum height, and the horizontal range.

---

**Step 0 — Set up the physical situation, frame, and sign convention before any formula.** Origin at the launch point, on the ground. Horizontal axis $x$ positive in the direction of travel; vertical axis $y$ positive upward. Then $a_x=0$ (nothing acts horizontally) and $a_y=-g=-10$ m/s$^2$ (gravity always points down, whichever way the ball is currently moving).

---

**Step 1 — Resolve the launch velocity into components.** $u_x=u\cos\theta=20(0.8)=16$ m/s. $u_y=u\sin\theta=20(0.6)=12$ m/s.

---

**Step 2 — Time of flight, from the vertical motion alone.** The ball returns to $y=0$ when $u_yT-\tfrac{1}{2}gT^2=0$, giving $T=\dfrac{2u_y}{g}=\dfrac{2(12)}{10}=2.4$ s.

---

**Step 3 — Maximum height, also from the vertical motion alone.** $H=\dfrac{u_y^2}{2g}=\dfrac{12^2}{2(10)}=\dfrac{144}{20}=7.2$ m.

---

**Step 4 — Range, from the horizontal motion, using the time found in Step 2.** Horizontal velocity never changes, so $R=u_x \times T=16\times2.4=38.4$ m.

$$\boxed{T=2.4\text{ s},\ \ H=7.2\text{ m},\ \ R=38.4\text{ m}}$$

---

**Why the two axes never mix inside the calculation.** $a_x$ never appears in $T$ or $H$, and $u_y$ never appears in $R$ except through $T$, which is itself a purely vertical-motion result. Each axis is solved with its own 1D equations of motion, using its own component of velocity and its own component of acceleration — the two calculations run in parallel and touch only at the final combination step, never before it.

