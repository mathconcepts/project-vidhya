---
id: rotational-mechanics.worked-example-shaken
concept_id: rotational-mechanics
atom_type: worked_example
variant_of: rotational-mechanics.worked-example
for_stance: shaken
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A uniform solid disc ($I_{cm}=\tfrac12MR^2$), released from rest, rolls without slipping down an incline through height $h=1\text{ m}$. Find its speed at the bottom. Take $g=10\text{ m/s}^2$.

---

**Step 0 — Set up before any formula.** This is rolling without slipping — the disc translates *and* spins, not pure rotation about one fixed point. Axis: through the centre of mass (matches the given $I_{cm}$). Frame: down the incline is positive for both $v$ and $\omega$.

---

**Step 1 — Name the conserved quantity.** Static friction acts at the contact point but does zero work there, so mechanical energy is conserved: $Mgh = KE_{translation}+KE_{rotation}$.

---

**Step 2 — Write the rolling condition.** $\omega = v/R$, since rolling without slipping links $v$ and $\omega$ directly.

---

**Step 3 — Plug both energy terms in, one at a time.** $KE_{translation}=\tfrac12Mv^2$. $KE_{rotation}=\tfrac12I_{cm}\omega^2 = \tfrac12\left(\tfrac12MR^2\right)\left(\dfrac{v^2}{R^2}\right)=\tfrac14Mv^2$.

---

**Step 4 — Add them and set equal to $Mgh$.** $Mgh = \tfrac12Mv^2+\tfrac14Mv^2 = \tfrac34Mv^2$.

---

**Step 5 — Solve.** $v^2 = \dfrac{4gh}{3} = \dfrac{4(10)(1)}{3}=\dfrac{40}{3}\approx13.33$, so $v\approx\sqrt{13.33}\approx3.65\text{ m/s}$.

---

**Step 6 — Check.** Compare to a frictionless block sliding the same height: $v=\sqrt{2gh}=\sqrt{20}\approx4.47\text{ m/s}$. The disc is slower, $3.65 < 4.47$, exactly as expected since some energy went into spinning it. $\boxed{v\approx3.65\text{ m/s}}$.

