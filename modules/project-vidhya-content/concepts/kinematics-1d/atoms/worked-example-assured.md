---
id: kinematics-1d.worked-example-assured
concept_id: kinematics-1d
atom_type: worked_example
variant_of: kinematics-1d.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A ball is thrown vertically upward from the ground with initial speed $u=20$ m/s. Take $g=10$ m/s$^2$. Find (a) the time to reach maximum height, (b) the maximum height, (c) the total time of flight, and (d) the velocity when it returns to the ground.

---

**Set-up.** Upward positive, ground as origin: $u=+20$ m/s, $a=-10$ m/s$^2$.

**(a)** $v=0=20-10t \Rightarrow t=2$ s. **(b)** $s=20(2)-5(2)^2=20$ m. **(c)** $0=20t-5t^2 \Rightarrow t=4$ s (return). **(d)** $v=20-10(4)=-20$ m/s.

$$\boxed{t_{\text{up}}=2\text{ s},\ \ h_{\max}=20\text{ m},\ \ T=4\text{ s},\ \ v_{\text{return}}=-20\text{ m/s}}$$

---

**A quietly false shortcut, and why it fails here specifically:** "time of flight is always double the time to the top." Take the same ball thrown upward from the edge of a $20$ m cliff instead. $t_{\text{up}}$ to the highest point is still $2$ s (only $u$ and $g$ decide that), but the fall to the ground below now covers an extra $20$ m past the launch point, so solving the vertical equation for that longer drop gives a time to land well past $4$ s — the up-leg and down-leg no longer match. The doubling only works when launch height equals landing height; that condition, not the formula itself, is what a question is really testing when it changes the ground level.

