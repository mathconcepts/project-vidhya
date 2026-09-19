---
id: electromagnetic-induction.worked-example-assured
concept_id: electromagnetic-induction
atom_type: worked_example
variant_of: electromagnetic-induction.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A metal rod of length $0.5\text{ m}$ slides at a constant $2\text{ m/s}$ along two parallel rails, in a uniform field $B = 0.4\text{ T}$ perpendicular to the plane of the rails. The rails are joined at one end by a resistor $R = 2\ \Omega$. Find the induced emf, the current, and the force an external agent must apply to keep the rod moving at constant speed.

---

**Step 1 — emf and current, as usual.** $\varepsilon = BLv = 0.4\text{ V}$, $I = \varepsilon/R = 0.2\text{ A}$.

---

**Step 2 — Skip $F = BIL$ and go straight through energy.** At *constant* velocity, all the mechanical power an agent supplies becomes heat in $R$: $Fv = I^2R \Rightarrow F = \dfrac{I^2R}{v} = \dfrac{(0.2)^2 \times 2}{2} = 0.04\text{ N}$ — matching $BIL$ exactly, without ever multiplying $B$, $I$, and $L$ together.

$$\boxed{\varepsilon = 0.4\text{ V}, \quad I = 0.2\text{ A}, \quad F = 0.04\text{ N}}$$

**Why this shortcut is not free.** $Fv = I^2R$ holds only because the rod's velocity is constant — none of the agent's power is going into speeding the rod up. If the rod were accelerating instead, $F = BIL$ would still be exactly true at every instant, but $F = I^2R/v$ would not: some of the mechanical power would be building kinetic energy, not all of it turning into heat. Reach for the energy shortcut only after confirming the motion is unaccelerated; otherwise it silently under-counts the force.
