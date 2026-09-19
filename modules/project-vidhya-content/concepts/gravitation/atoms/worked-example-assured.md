---
id: gravitation.worked-example-assured
concept_id: gravitation
atom_type: worked_example
variant_of: gravitation.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A satellite orbits at $r=2R$ from Earth's centre ($R=6400\text{ km}$, $g=9.8\text{ m/s}^2$). Find its orbital speed and time period.

---

**Step 0 — Set up before any formula.** Circular orbit, gravity as the sole centripetal force, Earth's centre as origin — only magnitudes matter here.

---

**Step 1 — Go straight to the surface-gravity form.** $v=\sqrt{gR^2/r}=\sqrt{gR/2}=\sqrt{(9.8)(6400000)/2}=5600\text{ m/s}$.

$$T = \frac{2\pi r}{v} = \frac{2\pi(2R)}{v} \approx 14362\text{ s} \approx 3.99\text{ hours}$$

$$\boxed{v=5600\text{ m/s},\ T\approx3.99\text{ hours}}$$

---

**Why $GM=gR^2$ is worth memorising outright.** Every orbit problem gives either $G$ and $M$ directly, or $g$ and $R$ at the surface — never both sets independently, since $GM=gR^2$ links them completely. Reaching for $g$ and $R$ instead of the full $G=6.674\times10^{-11}$ and a planetary mass in kilograms avoids carrying a $10^{-11}$ and a $10^{24}$ through the same calculation, which is exactly where a stray power of ten slips in under exam pressure. The same substitution turns $v_e=\sqrt{2GM/R}$ into $v_e=\sqrt{2gR}$ just as cleanly.

