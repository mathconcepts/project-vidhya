---
id: rotational-mechanics.worked-example
concept_id: rotational-mechanics
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A uniform solid disc ($I_{cm}=\tfrac12MR^2$) is released from rest and rolls without slipping down an incline, descending a vertical height $h=1\text{ m}$. Find its speed at the bottom. Take $g=10\text{ m/s}^2$.

---

**Step 0 — Set up before any formula.** Physical situation: the disc **rolls without slipping** — it is *not* pure rotation about a fixed point, since its centre of mass genuinely translates down the incline while the disc also spins. Axis choice: use the axis through the disc's own **centre of mass**, since $I_{cm}=\tfrac12MR^2$ is given about that axis, and the parallel axis theorem is not needed here at all. Frame: incline surface, with "down the incline" taken as the positive direction for both linear speed $v$ and the matching sense of angular speed $\omega$ (consistent with $v=\omega R$).

---

**Step 1 — Identify the conserved quantity.** Static friction acts at the contact point in rolling without slipping, but it does **zero work** there (the contact point is momentarily at rest), so mechanical energy is conserved: $Mgh = KE_{translation} + KE_{rotation}$.

---

**Step 2 — Write both kinetic energy terms.** $Mgh = \tfrac12Mv^2 + \tfrac12I_{cm}\omega^2$, with $I_{cm}=\tfrac12MR^2$ and, from rolling without slipping, $\omega = v/R$.

---

**Step 3 — Substitute and simplify.** $Mgh = \tfrac12Mv^2 + \tfrac12\left(\tfrac12MR^2\right)\left(\dfrac{v}{R}\right)^2 = \tfrac12Mv^2 + \tfrac14Mv^2 = \tfrac34Mv^2$.

---

**Step 4 — Solve for $v$.** $v^2 = \dfrac{4gh}{3} = \dfrac{4(10)(1)}{3} = \dfrac{40}{3}$, so $v = \sqrt{\dfrac{40}{3}} = \dfrac{2\sqrt{30}}{3} \approx 3.65\text{ m/s}$.

---

**Step 5 — State the answer.** $\boxed{v \approx 3.65\text{ m/s}}$ — noticeably slower than a frictionless block sliding the same height, which would reach $v=\sqrt{2gh}=\sqrt{20}\approx4.47\text{ m/s}$; the disc's extra rotational kinetic energy takes a real share of the available gravitational potential energy.

