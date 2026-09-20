---
id: kinetic-theory.worked-example-assured
concept_id: kinetic-theory
atom_type: worked_example
variant_of: kinetic-theory.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Same cylinder — but skip re-deriving $v_{rms}$ from scratch.

---

**Step 1 — Reuse a memorised benchmark instead of recomputing.** Nitrogen's rms speed at 300 K is about 517 m/s, worth keeping as a reference point. Helium's molar mass ($M=0.004$ kg/mol) is $7$ times smaller than nitrogen's ($0.028$ kg/mol). Since $v_{rms}\propto1/\sqrt{M}$ at fixed $T$, helium's rms speed is $517\sqrt{7}\approx1368$ m/s — matching a from-scratch calculation, for far less arithmetic.

---

**Step 2 — Internal energy and pressure are unaffected by this shortcut.** $U=\frac{3}{2}nRT=7482.6$ J and $P=nRT/V\approx99.8$ kPa, exactly as before.

$$\boxed{v_{rms}\approx1368\ \text{m/s},\quad U=7482.6\ \text{J},\quad P\approx99.8\ \text{kPa}}$$

---

**The trap this shortcut can't hide from.** $M$ must be in kilograms per mole in every one of these formulas. Plugging in $M=4$ (grams) instead of $M=0.004$ (kilograms) inflates $v_{rms}$ by $\sqrt{1000}\approx31.6$ — a wrong answer that still looks numerically ordinary, which is exactly why it survives a quick glance under time pressure.
