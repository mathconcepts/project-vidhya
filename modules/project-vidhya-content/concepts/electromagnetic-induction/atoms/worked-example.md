---
id: electromagnetic-induction.worked-example
concept_id: electromagnetic-induction
atom_type: worked_example
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A metal rod of length $0.5\text{ m}$ slides at a constant $2\text{ m/s}$ along two parallel rails, in a uniform field $B = 0.4\text{ T}$ perpendicular to the plane of the rails. The rails are joined at one end by a resistor $R = 2\ \Omega$. Find the induced emf, the current, and the force an external agent must apply to keep the rod moving at constant speed.

---

**Step 1 — Set up the configuration.** The rod, its velocity, and the field are all mutually perpendicular — exactly the condition for the simple motional-emf formula to apply directly, with no angle to resolve.

---

**Step 2 — Induced emf.** $\varepsilon = BLv = 0.4 \times 0.5 \times 2 = 0.4\text{ V}$.

---

**Step 3 — Induced current.** $I = \dfrac{\varepsilon}{R} = \dfrac{0.4}{2} = 0.2\text{ A}$.

---

**Step 4 — Force needed to keep the rod moving at constant speed.** By Lenz's law, the induced current opposes the *motion* causing it, so the magnetic force on the current-carrying rod acts to slow it down. To keep the speed constant, an external agent must supply an equal and opposite force: $F = BIL = 0.4 \times 0.2 \times 0.5 = 0.04\text{ N}$.

---

**Step 5 — Check with energy conservation.** Mechanical power delivered by the agent: $P = Fv = 0.04 \times 2 = 0.08\text{ W}$. Electrical power dissipated in $R$: $P = I^2R = (0.2)^2 \times 2 = 0.08\text{ W}$.

$$\boxed{\varepsilon = 0.4\text{ V}, \quad I = 0.2\text{ A}, \quad F = 0.04\text{ N}}$$

The two power values matching is not a coincidence — every joule the agent puts in to fight the induced force comes out as heat in the resistor. If these two numbers had not matched, a sign or a step above would be wrong.
