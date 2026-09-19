---
id: kinematics-2d.worked-example-shaken
concept_id: kinematics-2d
atom_type: worked_example
variant_of: kinematics-2d.worked-example
for_stance: shaken
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A ball is launched from the ground at $u=20$ m/s at an angle $\theta$ where $\sin\theta=0.6$, $\cos\theta=0.8$. Take $g=10$ m/s$^2$. Find the time of flight, the maximum height, and the horizontal range.

---

**Step 1 — Choose the axes and their positive directions.** Origin at launch, ground level. $x$ positive along the direction of travel. $y$ positive upward. So $a_x=0$ and $a_y=-10$ m/s$^2$.

---

**Step 2 — Resolve $u$ into its two pieces.** $u_x=u\cos\theta=20\times0.8=16$ m/s. $u_y=u\sin\theta=20\times0.6=12$ m/s.

---

**Step 3 — Time of flight, using only the vertical piece.** The ball is back at $y=0$ when $u_yT-\tfrac{1}{2}gT^2=0$. Solve: $T\left(u_y-\tfrac{1}{2}gT\right)=0$, so $T=0$ or $T=\dfrac{2u_y}{g}=\dfrac{2(12)}{10}$. Compute: $2\times12=24$, then $24/10=2.4$ s.

---

**Step 4 — Maximum height, still using only the vertical piece.** $H=\dfrac{u_y^2}{2g}=\dfrac{12^2}{2(10)}$. Compute: $12^2=144$, and $2\times10=20$, so $H=144/20=7.2$ m.

---

**Step 5 — Range, now bringing in the horizontal piece.** $u_x$ never changes, so $R=u_x \times T=16\times2.4$. Compute: $16\times2.4=38.4$ m.

$$\boxed{T=2.4\text{ s},\ \ H=7.2\text{ m},\ \ R=38.4\text{ m}}$$

---

**Check that the axes stayed separate.** $T$ and $H$ used only $u_y$ and $g$; $R$ used only $u_x$ and the already-found $T$ — $a_y$ and $u_y$ never appear inside the range calculation itself, confirming the two one-dimensional problems ran independently.

