---
id: thermodynamics-physics.worked-example-assured
concept_id: thermodynamics-physics
atom_type: worked_example
variant_of: thermodynamics-physics.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Same engine, but the question states $T_1=327^\circ\text{C}$ and $T_2=27^\circ\text{C}$ instead of kelvin values.

---

**Step 1 — Convert to kelvin before touching the formula.** $T_1=327+273=600$ K, $T_2=27+273=300$ K — identical to the earlier numbers, by design.

---

**Step 2 — Reuse the earlier results directly.**

$$\boxed{\eta=50\%,\quad W=500\ \text{J},\quad Q_2=500\ \text{J}}$$

---

**The trap this conversion sidesteps.** Plugging $327$ and $27$ straight into $\eta=1-T_2/T_1$ without converting gives $\eta=1-27/327\approx0.917$ — a wildly inflated $91.7\%$, which should look suspicious immediately: a Carnot efficiency that close to $100\%$ needs the cold reservoir near absolute zero, not a mild $27^\circ\text{C}$ room. Every temperature entering the Carnot, isothermal, or adiabatic formulas must be absolute (kelvin) — Celsius, unconverted, silently produces a confidently wrong efficiency.
